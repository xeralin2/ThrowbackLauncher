import contextlib
import shutil
import threading
from pathlib import Path

from PySide6.QtCore import Property, QObject, Signal, Slot
from PySide6.QtWidgets import QFileDialog

from core import log
from core.constants import (
    BIN_DIR,
    DD_BIN,
    DEFAULT_ACCENT,
    DEFAULT_BAR_FILL,
    DEFAULT_BAR_STRIPE,
    DEFAULT_DOWNLOADS_DIR,
    DEFAULT_MAX_DOWNLOADS,
    DEFAULT_USERNAME,
    DOWNLOADS_MAX,
    DOWNLOADS_MIN,
    HEX_PATTERN,
    LOG_FILE,
    MAX_USERNAME_LENGTH,
    NAME_PATTERN,
    SEVENZ_BIN,
    TL_DIR,
    UPDATE_RUNNING,
)
from core.manifest import (
    installed_downloads,
    is_season_folder,
    local_downloads,
    write_download_username,
)
from core.rpc import is_discord_installed
from core.settings import (
    default_library,
    get_setting,
    save_settings,
    set_libraries,
    set_setting,
)
from core.settings import (
    libraries as library_roots,
)
from core.steam import list_protons, resolve_proton
from layout import user_data_base


def _wipe_depot_token() -> tuple[bool, list[str]]:
    iso_dir = user_data_base() / "IsolatedStorage"
    stores = (sorted({p.parent.parent for p in iso_dir.rglob("AssemFiles/account.config")})
              if iso_dir.exists() else [])
    if not stores:
        return False, []
    errors = []
    for store in stores:
        try:
            shutil.rmtree(store)
        except OSError as e:
            errors.append(log.fail("Could not remove the Steam token", e))
    return True, errors


def _clear_download_cache() -> None:
    DD_BIN.unlink(missing_ok=True)
    SEVENZ_BIN.unlink(missing_ok=True)
    LOG_FILE.unlink(missing_ok=True)
    for archive in BIN_DIR.glob("*.7z"):
        archive.unlink(missing_ok=True)
    shutil.rmtree(TL_DIR, ignore_errors=True)


def _display_path(root: Path) -> str:
    try:
        return str(Path("~") / root.relative_to(Path.home().resolve()))
    except ValueError:
        return str(root)


class SettingsController(QObject):
    username_changed = Signal()
    steam_account_changed = Signal()
    max_downloads_changed = Signal()
    discord_rpc_changed = Signal()
    reduce_motion_changed = Signal()
    settings_error = Signal(str, str)
    logged_out = Signal(str, str)
    cache_cleared = Signal()
    libraries_changed = Signal()
    home_order_changed = Signal()
    home_sizes_changed = Signal()
    liberator_enabled_changed = Signal()
    rvpn_autorun_changed = Signal()
    proton_changed = Signal()
    bar_fill_changed = Signal()
    bar_stripe_changed = Signal()
    accent_changed = Signal()

    _cache_cleared_in = Signal(str)
    _logged_out_in = Signal(str, str)

    def __init__(self, settings: dict, downloader: QObject, updater: QObject) -> None:
        super().__init__()
        self._settings = settings
        self._downloader = downloader
        self._updater = updater
        self._clearing_cache = False
        self._logging_out = False
        self._cache_cleared_in.connect(self._on_cache_cleared)
        self._logged_out_in.connect(self._on_logged_out)

    @Property(str, notify=username_changed)
    def username(self) -> str:
        return get_setting(self._settings, "username", DEFAULT_USERNAME)

    @Property(str, notify=steam_account_changed)
    def steam_account(self) -> str:
        return get_setting(self._settings, "steam_account", "")

    @Property(int, notify=max_downloads_changed)
    def max_downloads(self) -> int:
        return get_setting(self._settings, "max_downloads", DEFAULT_MAX_DOWNLOADS)

    @Property(bool, notify=discord_rpc_changed)
    def discord_rpc(self) -> bool:
        return bool(get_setting(self._settings, "discord_rpc", True))

    @Property(bool, notify=reduce_motion_changed)
    def reduce_motion(self) -> bool:
        return bool(get_setting(self._settings, "reduce_motion", False))

    @Property("QVariantList", notify=home_order_changed)
    def home_order(self) -> list:
        return [str(k) for k in get_setting(self._settings, "home_order", [])]

    @Slot("QVariantList")
    def set_home_order(self, order: list) -> None:
        value = [str(k) for k in order]
        if value == self.home_order:
            return
        self._store("home_order", value)
        self.home_order_changed.emit()

    @Property("QVariantMap", notify=home_sizes_changed)
    def home_sizes(self) -> dict:
        raw = get_setting(self._settings, "home_sizes", {})
        return {str(k): v for k, v in raw.items() if isinstance(v, str)}

    @Slot(str, int, int)
    def set_home_size(self, key: str, width: int, height: int) -> None:
        size = f"{max(1, min(4, width))}x{max(1, min(7, height))}"
        sizes = self.home_sizes
        if size == "1x2":
            if key not in sizes:
                return
            del sizes[key]
        elif sizes.get(key) == size:
            return
        else:
            sizes[key] = size
        self._store("home_sizes", sizes)
        self.home_sizes_changed.emit()

    @Slot()
    def reset_home_layout(self) -> None:
        table = self._settings.get("settings", {})
        removed = [table.pop(key, None) for key in ("home_order", "home_sizes")]
        if all(value is None for value in removed):
            return
        save_settings(self._settings)
        self.home_order_changed.emit()
        self.home_sizes_changed.emit()

    @Property(bool, notify=liberator_enabled_changed)
    def liberator_enabled(self) -> bool:
        return bool(get_setting(self._settings, "liberator_enabled", True))

    @Slot(bool)
    def set_liberator_enabled(self, value: bool) -> None:
        if value == self.liberator_enabled:
            return
        self._store("liberator_enabled", bool(value))
        self.liberator_enabled_changed.emit()

    @Property(bool, notify=rvpn_autorun_changed)
    def rvpn_autorun(self) -> bool:
        return bool(get_setting(self._settings, "rvpn_autorun", False))

    @Slot(bool)
    def set_rvpn_autorun(self, value: bool) -> None:
        if value == self.rvpn_autorun:
            return
        self._store("rvpn_autorun", bool(value))
        self.rvpn_autorun_changed.emit()

    @Property(str, notify=proton_changed)
    def proton(self) -> str:
        proton = resolve_proton(self._settings)
        return proton["internal"] if proton is not None else ""

    @Slot(result="QVariantList")
    def proton_options(self) -> list:
        return [{"internal": p["internal"], "display": p["display"]} for p in list_protons()]

    @Slot(str)
    def set_proton(self, internal: str) -> None:
        if internal not in {p["internal"] for p in list_protons()} or internal == self.proton:
            return
        self._store("proton", internal)
        self.proton_changed.emit()

    @Property(str, notify=bar_fill_changed)
    def bar_fill(self) -> str:
        return self._color("bar_fill", DEFAULT_BAR_FILL)

    @Slot(str)
    def set_bar_fill(self, value: str) -> None:
        self._store_color(
            "bar_fill", value, self.bar_fill, self.bar_fill_changed, DEFAULT_BAR_FILL
        )

    @Slot()
    def reset_accent(self) -> None:
        table = self._settings.get("settings", {})
        if table.pop("accent", None) is None:
            return
        save_settings(self._settings)
        self.accent_changed.emit()

    @Property(str, notify=accent_changed)
    def accent(self) -> str:
        return self._color("accent", DEFAULT_ACCENT)

    @Slot(str)
    def set_accent(self, value: str) -> None:
        self._store_color("accent", value, self.accent, self.accent_changed, DEFAULT_ACCENT)

    @Property(str, notify=bar_stripe_changed)
    def bar_stripe(self) -> str:
        return self._color("bar_stripe", DEFAULT_BAR_STRIPE)

    @Slot(str)
    def set_bar_stripe(self, value: str) -> None:
        self._store_color(
            "bar_stripe", value, self.bar_stripe, self.bar_stripe_changed, DEFAULT_BAR_STRIPE
        )

    def _color(self, key: str, default: str) -> str:
        value = str(get_setting(self._settings, key, default))
        return value if HEX_PATTERN.match(value) else default

    def _store_color(self, key: str, value: str, current: str, changed: Signal,
                     default: str) -> None:
        color = value.strip().lower()
        if not HEX_PATTERN.match(color):
            self.settings_error.emit(key, f"Enter a color like {default}")
            return
        if color == current:
            return
        self._store(key, color)
        changed.emit()

    @Property("QVariantMap", constant=True)
    def download_bounds(self) -> dict:
        return {"min": DOWNLOADS_MIN, "max": DOWNLOADS_MAX}

    def _store(self, key: str, value: object) -> None:
        set_setting(self._settings, key, value)
        save_settings(self._settings)

    @Slot(str)
    def set_username(self, value: str) -> None:
        value = value.strip()
        if not value:
            self.settings_error.emit("username", "Username is empty")
            return
        if len(value) > MAX_USERNAME_LENGTH:
            self.settings_error.emit(
                "username", f"Username is too long (max {MAX_USERNAME_LENGTH} characters)"
            )
            return
        if not NAME_PATTERN.match(value):
            self.settings_error.emit(
                "username", "Username can only use letters, digits, . _ -"
            )
            return
        if value == self.username:
            return
        self._store("username", value)
        for d in installed_downloads():
            with contextlib.suppress(OSError):
                write_download_username(d, value)
        self.username_changed.emit()

    def set_steam_account(self, value: str) -> None:
        value = value.strip()
        if value == self.steam_account:
            return
        self._store("steam_account", value)
        self.steam_account_changed.emit()

    @Slot(int)
    def set_max_downloads(self, value: int) -> None:
        if not DOWNLOADS_MIN <= value <= DOWNLOADS_MAX:
            self.settings_error.emit(
                "max_downloads", f"Parallel downloads must be {DOWNLOADS_MIN}–{DOWNLOADS_MAX}")
            return
        if value == self.max_downloads:
            return
        self._store("max_downloads", value)
        self.max_downloads_changed.emit()

    @Slot(bool)
    def set_discord_rpc(self, value: bool) -> None:
        if value == self.discord_rpc:
            return
        if value and not is_discord_installed():
            self.settings_error.emit("discord_rpc", "Discord is not installed")
            return
        self._store("discord_rpc", value)
        self.discord_rpc_changed.emit()

    @Slot(bool)
    def set_reduce_motion(self, value: bool) -> None:
        if value == self.reduce_motion:
            return
        self._store("reduce_motion", value)
        self.reduce_motion_changed.emit()

    @Slot()
    def logout(self) -> None:
        if self._logging_out:
            return
        if self._downloader.running:
            self.settings_error.emit("logout", "A download is using your Steam session")
            return
        if self._updater.busy:
            self.settings_error.emit("logout", UPDATE_RUNNING)
            return
        self.set_steam_account("")
        self._logging_out = True

        def work() -> None:
            found, errors = _wipe_depot_token()
            if errors:
                self._logged_out_in.emit("error", errors[0])
            elif found:
                self._logged_out_in.emit("success", "Logged out")
            else:
                self._logged_out_in.emit("warning", "No Steam token found")

        threading.Thread(target=work, daemon=True).start()

    def _on_logged_out(self, kind: str, message: str) -> None:
        self._logging_out = False
        self.logged_out.emit(kind, message)

    def _transfers_busy(self) -> bool:
        return bool(self._downloader.running or self._updater.busy)

    @Slot(result="QVariantList")
    def libraries(self) -> list:
        folders = local_downloads()
        return [
            {
                "path": str(root),
                "display": _display_path(root),
                "default": i == 0,
                "fixed": root == DEFAULT_DOWNLOADS_DIR,
                "exists": root.exists(),
                "seasons": sum(1 for d in folders if d.parent == root),
            }
            for i, root in enumerate(library_roots())
        ]

    def _save_libraries(self, roots: list[Path]) -> None:
        values = [str(root) for root in roots]
        self._store("libraries", values)
        set_libraries(values)
        self.libraries_changed.emit()

    @Slot()
    def add_library(self) -> None:
        if self._transfers_busy():
            self.settings_error.emit("libraries", "A download or update is running")
            return
        picked = QFileDialog.getExistingDirectory(
            None, "Choose library folder", str(default_library())
        )
        if not picked:
            return
        path = Path(picked).resolve()
        if is_season_folder(path):
            path = path.parent
        roots = library_roots()
        if path in roots:
            self.settings_error.emit("libraries", "Folder is already a library")
            return
        if any(path.is_relative_to(root) or root.is_relative_to(path) for root in roots):
            self.settings_error.emit("libraries", "Library folders cannot contain each other")
            return
        self._save_libraries([*roots, path])

    @Slot(str)
    def remove_library(self, path: str) -> None:
        roots = library_roots()
        target = Path(path)
        if target == DEFAULT_DOWNLOADS_DIR:
            self.settings_error.emit("libraries", "The Launcher folder cannot be removed")
            return
        if target not in roots:
            return
        if self._updater.busy:
            self.settings_error.emit("libraries", UPDATE_RUNNING)
            return
        if self._downloader.uses_library(target):
            self.settings_error.emit("libraries", "A download is using this library")
            return
        self._save_libraries([root for root in roots if root != target])

    @Slot(str)
    def set_default_library(self, path: str) -> None:
        roots = library_roots()
        target = Path(path)
        if target not in roots or target == roots[0]:
            return
        if not target.exists():
            self.settings_error.emit("libraries", "Folder not found, is the drive connected?")
            return
        self._save_libraries([target, *(root for root in roots if root != target)])

    def clearing_cache(self) -> bool:
        return self._clearing_cache

    @Slot()
    def clear_cache(self) -> None:
        if self._clearing_cache:
            return
        if self._transfers_busy():
            self.settings_error.emit("cache", "A download or update is running")
            return
        self._clearing_cache = True

        def work() -> None:
            message = ""
            try:
                _clear_download_cache()
            except Exception as e:
                message = log.fail("Could not clear the cache", e)
            self._cache_cleared_in.emit(message)

        threading.Thread(target=work, daemon=True).start()

    def _on_cache_cleared(self, message: str) -> None:
        self._clearing_cache = False
        if message:
            self.settings_error.emit("cache", message)
            return
        self.cache_cleared.emit()
