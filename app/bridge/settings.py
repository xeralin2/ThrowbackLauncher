import contextlib
import shutil
import threading
from pathlib import Path

from PySide6.QtCore import Property, QObject, Signal, Slot
from PySide6.QtWidgets import QFileDialog

from core import log
from core.constants import (
    user_data_base,
    DD_BIN,
    DEFAULT_ACCENT,
    DEFAULT_DOWNLOADS_DIR,
    DEFAULT_BAR_FILL,
    DEFAULT_BAR_STRIPE,
    DEFAULT_MAX_DOWNLOADS,
    DEFAULT_USERNAME,
    DOWNLOADS_MAX,
    DOWNLOADS_MIN,
    HELIOS_DIR,
    HEX_PATTERN,
    LOG_FILE,
    MAX_USERNAME_LENGTH,
    NAME_PATTERN,
    SEVENZ_BIN,
    TL_DIR,
)
from core.manifest import installed_downloads, local_downloads, write_download_username
from core.rpc import is_discord_installed
from core.settings import (
    default_library,
    get_setting,
    libraries as library_roots,
    save_settings,
    set_libraries,
    set_setting,
)
from core.steam import list_protons, resolve_proton


def _depot_token_stores(iso_dir: Path) -> list[Path]:
    return sorted({p.parent.parent for p in iso_dir.rglob("AssemFiles/account.config")})


def _isolated_storage_dir() -> Path:
    return user_data_base() / "IsolatedStorage"


def _wipe_depot_token() -> tuple[bool, list[str]]:
    iso_dir = _isolated_storage_dir()
    stores = _depot_token_stores(iso_dir) if iso_dir.exists() else []
    if not stores:
        return False, []
    errors = []
    for store in stores:
        try:
            shutil.rmtree(store)
        except OSError as e:
            errors.append(log.fail(f"Could not remove {store}", e))
    return True, errors


def _clear_download_cache() -> None:
    DD_BIN.unlink(missing_ok=True)
    SEVENZ_BIN.unlink(missing_ok=True)
    LOG_FILE.unlink(missing_ok=True)
    shutil.rmtree(TL_DIR, ignore_errors=True)
    shutil.rmtree(HELIOS_DIR, ignore_errors=True)


def _display_path(root: Path) -> str:
    try:
        return str(Path("~") / root.relative_to(Path.home().resolve()))
    except ValueError:
        return str(root)


class Settings(QObject):
    username_changed = Signal()
    steam_account_changed = Signal()
    max_downloads_changed = Signal()
    discord_rpc_changed = Signal()
    invalid_setting = Signal(str, str)
    logged_out = Signal(bool, str)
    cache_cleared = Signal()
    libraries_changed = Signal()
    home_order_changed = Signal()
    home_sizes_changed = Signal()
    liberator_enabled_changed = Signal()
    rvpn_autostart_changed = Signal()
    proton_changed = Signal()
    bar_fill_changed = Signal()
    bar_stripe_changed = Signal()
    accent_changed = Signal()

    _cache_cleared_in = Signal(str)
    _logged_out_in = Signal(bool, str)

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
        return get_setting(self._settings, "discord_rpc", True)

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
        changed = False
        for key in ("home_order", "home_sizes"):
            if key in table:
                del table[key]
                changed = True
        if not changed:
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

    @Property(bool, notify=rvpn_autostart_changed)
    def rvpn_autostart(self) -> bool:
        return bool(get_setting(self._settings, "rvpn_autostart", False))

    @Slot(bool)
    def set_rvpn_autostart(self, value: bool) -> None:
        if value == self.rvpn_autostart:
            return
        self._store("rvpn_autostart", bool(value))
        self.rvpn_autostart_changed.emit()

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
        self._store_color("bar_fill", value, self.bar_fill, self.bar_fill_changed)

    @Slot()
    def reset_accent(self) -> None:
        table = self._settings.get("settings", {})
        if "accent" not in table:
            return
        del table["accent"]
        save_settings(self._settings)
        self.accent_changed.emit()

    @Property(str, notify=accent_changed)
    def accent(self) -> str:
        return self._color("accent", DEFAULT_ACCENT)

    @Slot(str)
    def set_accent(self, value: str) -> None:
        self._store_color("accent", value, self.accent, self.accent_changed)

    @Property(str, notify=bar_stripe_changed)
    def bar_stripe(self) -> str:
        return self._color("bar_stripe", DEFAULT_BAR_STRIPE)

    @Slot(str)
    def set_bar_stripe(self, value: str) -> None:
        self._store_color(
            "bar_stripe", value, self.bar_stripe, self.bar_stripe_changed
        )

    def _color(self, key: str, default: str) -> str:
        value = str(get_setting(self._settings, key, default))
        return value if HEX_PATTERN.match(value) else default

    def _store_color(self, key: str, value: str, current: str, changed: Signal) -> None:
        color = value.strip().lower()
        if not HEX_PATTERN.match(color):
            self.invalid_setting.emit(key, f"Enter a color like {DEFAULT_BAR_FILL}")
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
            self.invalid_setting.emit("username", "Username is empty")
            return
        if len(value) > MAX_USERNAME_LENGTH:
            self.invalid_setting.emit(
                "username", f"Username is too long (max {MAX_USERNAME_LENGTH} characters)"
            )
            return
        if not NAME_PATTERN.match(value):
            self.invalid_setting.emit("username", "Only letters, digits, . _ - are allowed")
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
            self.invalid_setting.emit(
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
            self.invalid_setting.emit("discord_rpc", "Discord is not installed")
            return
        self._store("discord_rpc", value)
        self.discord_rpc_changed.emit()

    @Slot()
    def logout(self) -> None:
        if self._logging_out:
            return
        if self._transfers_busy():
            self.invalid_setting.emit("logout", "A download is using your Steam session")
            return
        self.set_steam_account("")
        self._logging_out = True

        def work() -> None:
            found, errors = _wipe_depot_token()
            if errors:
                self._logged_out_in.emit(False, errors[0])
            else:
                self._logged_out_in.emit(True, "Logged out" if found else "No Steam token found")

        threading.Thread(target=work, daemon=True).start()

    def _on_logged_out(self, ok: bool, message: str) -> None:
        self._logging_out = False
        self.logged_out.emit(ok, message)

    def _transfers_busy(self) -> bool:
        return bool(self._downloader.property("running") or self._updater.property("busy"))

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
            self.invalid_setting.emit("libraries", "Wait for the active download to finish")
            return
        picked = QFileDialog.getExistingDirectory(
            None, "Choose library folder", str(default_library())
        )
        if not picked:
            return
        path = Path(picked).resolve()
        roots = library_roots()
        if path in roots:
            self.invalid_setting.emit("libraries", "Folder is already a library")
            return
        if any(path.is_relative_to(root) or root.is_relative_to(path) for root in roots):
            self.invalid_setting.emit("libraries", "Library folders cannot contain each other")
            return
        self._save_libraries([*roots, path])

    @Slot(str)
    def remove_library(self, path: str) -> None:
        if self._transfers_busy():
            self.invalid_setting.emit("libraries", "Wait for the active download to finish")
            return
        roots = library_roots()
        target = Path(path)
        if target == DEFAULT_DOWNLOADS_DIR:
            self.invalid_setting.emit("libraries", "The launcher folder cannot be removed")
            return
        if target not in roots:
            return
        self._save_libraries([root for root in roots if root != target])

    @Slot(str)
    def set_default_library(self, path: str) -> None:
        roots = library_roots()
        target = Path(path)
        if target not in roots or target == roots[0]:
            return
        if not target.exists():
            self.invalid_setting.emit("libraries", "Folder not found, is the drive connected?")
            return
        self._save_libraries([target, *(root for root in roots if root != target)])

    def clearing_cache(self) -> bool:
        return self._clearing_cache

    @Slot()
    def clear_cache(self) -> None:
        if self._clearing_cache:
            return
        if self._transfers_busy():
            self.invalid_setting.emit("cache", "Wait for the active download to finish")
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
            self.invalid_setting.emit("cache", message)
            return
        self.cache_cleared.emit()
