import math
import re
import shutil
import threading
from collections import deque
from collections.abc import Callable
from pathlib import Path

from PySide6.QtCore import Property, QObject, QProcess, QTimer, Signal, Slot

from bridge.dialogs import pick_file
from bridge.reporter import SignalReporter
from core import log
from core.constants import (
    BIN_DIR,
    BUSY_MESSAGE,
    CACHE_CLEARING,
    DEFAULT_MAX_DOWNLOADS,
    DEFAULT_USERNAME,
    DOWNLOAD_RUNNING,
    NAME_PATTERN,
    REMOVING_FILES,
    TL_EXTRACT,
    TL_LAUNCHER,
    UPDATE_RUNNING,
)
from core.depot import RateLimited, depot_commands, ensure_depotdownloader
from core.heatedmetal import apply_hm, cache_hm_archive, remove_hm_files
from core.manifest import (
    edition_folder,
    installed_path,
    installed_username,
    partial_path,
)
from core.reporter import NullReporter, Reporter
from core.settings import default_library, get_setting, libraries, save_settings, set_setting
from core.steam import SEASON_RUNNING, is_season_running, season_pids, stop_game
from core.throwbackloader import apply_tl, ensure_tl, write_launcher

_PERCENT = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*%")
_STAGING_HEADROOM = 2 * 2**30


def _out_of_space(root: Path) -> bool:
    try:
        return shutil.disk_usage(root).free < _STAGING_HEADROOM
    except OSError:
        return False


def _apply_install(target: Path, download: dict, is_hm: bool, username: str,
                  include_launcher: bool = True, reporter: Reporter | None = None,
                  archive: Path | None = None) -> bool:
    if is_hm:
        return apply_hm(target, username, download, reporter=reporter, archive=archive)
    reporter = reporter or NullReporter()
    reporter.update("Copying files")
    try:
        apply_tl(target, username)
        if include_launcher:
            write_launcher(target, reporter)
    except OSError as e:
        reporter.fail(log.fail("ThrowbackLoader setup failed", e))
        return False
    return True


class DownloadController(QObject):
    log_line = Signal(str)
    log_history = Signal(str, str)
    progress_changed = Signal()
    running_changed = Signal()
    state_changed = Signal()
    verifying_changed = Signal()
    done = Signal(str, str)
    login_required = Signal(str)
    disk_space_required = Signal(float)
    error = Signal(str)
    active_key_changed = Signal()
    active_hm_changed = Signal()
    partial_deleted = Signal(str, bool, bool, str)
    rate_limited = Signal(str)
    warning = Signal(str)
    queue_changed = Signal()

    _prepare_done_in = Signal(int, str, str)
    _apply_done_in = Signal(int, bool)
    _deleted_in = Signal(str, bool, bool, str)
    _error_in = Signal(str)
    _rate_limited_in = Signal(str)

    def __init__(self, settings: dict, downloads: list[dict],
                 parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._settings = settings
        self._downloads = downloads
        self._process: QProcess | None = None
        self._proc_done = False
        self._progress = 0.0
        self._running = False
        self._state = "idle"
        self._active_key = ""
        self._cancelled = False
        self._generation = 0
        self._login_pending = False
        self._login_kind = ""
        self._pending_password = ""
        self._pending_request: tuple | None = None
        self._buffer = ""
        self._history: deque[str] = deque(maxlen=2000)
        self._commands: list[dict] = []
        self._index = 0
        self._step = 0
        self._steps = 0
        self._download: dict = {}
        self._enable_hm = False
        self._verifying = False
        self._steam_account = ""
        self._max_downloads = DEFAULT_MAX_DOWNLOADS
        self._target = default_library()
        self._dd = ""
        self._deleting_key: str | None = None
        self._picking = False
        self._picked_archive: Path | None = None
        self._archive: Path | None = None
        self._username = ""
        self._rate_limit_hit = False
        self._switching = ""
        self._paused = bool(get_setting(settings, "queue_paused", False))
        known = {d["key"] for d in downloads}
        self._queue: list[tuple[str, bool, str, bool]] = [
            (item["key"], bool(item.get("hm")), str(item.get("library", "")),
             bool(item.get("verify")))
            for item in get_setting(settings, "queue", [])
            if isinstance(item, dict) and item.get("key") in known
            and (installed_path(item["key"], bool(item.get("hm"))) is not None)
            == bool(item.get("verify"))
        ]
        if self._paused:
            if self._enter_paused_from_queue():
                self._state = "paused"
            else:
                self._clear_paused_flag()
        self.log_line.connect(self._history.append)
        self._prepare_done_in.connect(self._on_prepare_done_in)
        self._apply_done_in.connect(self._on_apply_done_in)
        self._deleted_in.connect(self._on_deleted)
        self._error_in.connect(self.error)
        self._rate_limited_in.connect(self._on_rate_limited_in)

    @Property(float, notify=progress_changed)
    def progress(self) -> float:
        return self._progress

    @Property(int, notify=progress_changed)
    def step(self) -> int:
        return self._step

    @Property(int, notify=progress_changed)
    def steps(self) -> int:
        return self._steps

    @Property(bool, notify=running_changed)
    def running(self) -> bool:
        return self._running

    @Property(str, notify=state_changed)
    def state(self) -> str:
        return self._state

    @Property(str, notify=active_key_changed)
    def active_key(self) -> str:
        return self._active_key

    @Property(bool, notify=active_hm_changed)
    def active_hm(self) -> bool:
        return self._enable_hm

    @Property(bool, notify=verifying_changed)
    def verifying(self) -> bool:
        return self._verifying

    def _set_progress(self, value: float) -> None:
        if value != self._progress:
            self._progress = value
            self.progress_changed.emit()

    def _set_step(self, index: int, total: int) -> None:
        if (index, total) != (self._step, self._steps):
            self._step = index
            self._steps = total
            self.progress_changed.emit()

    def _set_running(self, value: bool) -> None:
        if value != self._running:
            self._running = value
            self.running_changed.emit()

    def _set_state(self, value: str) -> None:
        if value != self._state:
            self._state = value
            self.state_changed.emit()

    def _set_verifying(self, value: bool) -> None:
        if value != self._verifying:
            self._verifying = value
            self.verifying_changed.emit()

    def _set_enable_hm(self, value: bool) -> None:
        if value != self._enable_hm:
            self._enable_hm = value
            self.active_hm_changed.emit()

    def set_peers(self, updater: QObject, settings_bridge: QObject, uninstaller: QObject,
                  launch: QObject, shears: QObject) -> None:
        self._updater = updater
        self._settings_bridge = settings_bridge
        self._uninstaller = uninstaller
        self._shears = shears
        updater.changed.connect(self._start_next)
        settings_bridge.steam_account_changed.connect(self._start_next)
        settings_bridge.cache_cleared.connect(self._start_next)
        uninstaller.done.connect(lambda *_: self._start_next())
        shears.cut_done.connect(lambda *_: self._start_next())
        launch.running_changed.connect(lambda *_: self._start_next())
        QTimer.singleShot(0, self._start_next)

    def _conflicts(self, season_key: str) -> bool:
        if self._uninstaller.busy_key() == season_key:
            self.error.emit("Uninstall is running")
            return True
        if self._shears.busy_key() == season_key:
            self.error.emit("Shears is running")
            return True
        if self._updater.busy:
            self.error.emit(UPDATE_RUNNING)
            return True
        if self._settings_bridge.clearing_cache():
            self.error.emit(CACHE_CLEARING)
            return True
        return False

    def _accept(self, season_key: str, resume: tuple) -> dict | None:
        if self._running:
            self.error.emit(DOWNLOAD_RUNNING)
            return None
        if self._picking or self._pending_request is not None:
            return None
        if self._deleting_key == season_key:
            self.error.emit(REMOVING_FILES)
            return None
        if self._conflicts(season_key):
            return None
        download = next((d for d in self._downloads if d["key"] == season_key), None)
        if download is None:
            self.error.emit("Unknown download")
            return None
        steam_account = get_setting(self._settings, "steam_account", "")
        if not steam_account or not NAME_PATTERN.match(steam_account):
            self._pending_request = resume
            self._login_kind = "account"
            self.login_required.emit("account")
            return None
        self._steam_account = steam_account
        return download

    @Slot(str, bool, str)
    def start(self, season_key: str, enable_hm: bool, library: str) -> None:
        QTimer.singleShot(0, lambda: self._start(season_key, enable_hm, library))

    @Slot(str, bool, str)
    def enqueue(self, season_key: str, enable_hm: bool, library: str) -> None:
        QTimer.singleShot(0, lambda: self._enqueue(season_key, enable_hm, library))

    def _enqueue(self, season_key: str, enable_hm: bool, library: str) -> None:
        if not self._running:
            self._start(season_key, enable_hm, library)
            return
        if self._active_or_queued(season_key, enable_hm):
            return
        if installed_path(season_key, enable_hm) is not None:
            self.error.emit("Already installed")
            return
        self._queue.append((season_key, enable_hm, library, False))
        self._queue_updated()

    @Slot(str, bool)
    def dequeue(self, season_key: str, hm: bool) -> None:
        QTimer.singleShot(0, lambda: self._dequeue(season_key, hm))

    def _dequeue(self, season_key: str, hm: bool) -> None:
        remaining = [
            item for item in self._queue if item[0] != season_key or item[1] != hm
        ]
        if len(remaining) != len(self._queue):
            self._queue = remaining
            self._queue_updated()

    def queued_items(self) -> list:
        return [{"key": item[0], "hm": item[1], "verify": item[3]} for item in self._queue]

    @Slot("QVariantList")
    def reorder_queue(self, entries: list) -> None:
        QTimer.singleShot(0, lambda: self._reorder_queue(list(entries)))

    def _reorder_queue(self, entries: list) -> None:
        refs = [
            (str(entry["key"]), bool(entry["hm"]))
            for entry in entries
            if isinstance(entry, dict)
        ]
        by_ref = {(item[0], item[1]): item for item in self._queue}
        reordered = [by_ref.pop(ref) for ref in refs if ref in by_ref]
        reordered.extend(by_ref.values())
        if reordered != self._queue:
            self._queue = reordered
            self._queue_updated()

    @Slot(bool)
    def set_paused(self, value: bool) -> None:
        QTimer.singleShot(0, lambda: self._set_paused(value))

    def _enter_paused_from_queue(self) -> bool:
        index = next(
            (i for i, item in enumerate(self._queue) if not item[3]), None
        )
        if index is None:
            return False
        key, hm, library, _ = self._queue.pop(index)
        self._active_key = key
        self._set_enable_hm(hm)
        partial, root = self._resolve_root(key, hm, library)
        self._target = partial if partial is not None else root / edition_folder(key, hm)
        self._set_progress(0.0)
        return True

    def _set_paused(self, value: bool) -> None:
        if value == self._paused:
            return
        if value:
            self._paused = True
            set_setting(self._settings, "queue_paused", True)
            save_settings(self._settings)
            if self._running:
                if not self._verifying:
                    self._cancel()
            elif self._state != "paused" and self._enter_paused_from_queue():
                self.active_key_changed.emit()
                self._set_state("paused")
                self._queue_updated()
        elif self._state == "paused" and self._active_key:
            self._start(self._active_key, self._enable_hm, str(self._target.parent))
        else:
            self._clear_paused_flag()
            self._start_next()

    def _queue_updated(self) -> None:
        self._persist_queue()
        self.queue_changed.emit()

    def _persist_queue(self) -> None:
        entries = list(self._queue)
        active = (self._running or self._state == "paused") and self._active_key
        request = self._pending_request
        if (request is not None and request[0] == "disk"
                and (not active or request[1:3] != (self._active_key, self._enable_hm))):
            _, key, hm, library = request
            entries.insert(0, (key, hm, library, False))
        if active:
            entries.insert(0, (self._active_key, self._enable_hm,
                               str(self._target.parent), self._verifying))
        set_setting(self._settings, "queue", [
            {"key": key, "hm": hm, "library": library, "verify": verify}
            for key, hm, library, verify in entries
        ])
        save_settings(self._settings)

    def _active_or_queued(self, key: str, hm: bool) -> bool:
        return (key, hm) == (self._active_key, self._enable_hm) or any(
            item[0] == key and item[1] == hm for item in self._queue
        )

    def busy_with(self, key: str) -> bool:
        return self._running and self._active_key == key

    def uses_library(self, root: Path) -> bool:
        target = Path(root).resolve()
        if (
            (self._running or self._state == "paused")
            and self._active_key
            and self._target.parent.resolve() == target
        ):
            return True
        return any(self._queued_root(*item) == target for item in self._queue)

    def _resolve_root(self, key: str, hm: bool, library: str) -> tuple[Path | None, Path]:
        partial = partial_path(key, hm)
        if partial is not None:
            return partial, partial.parent
        return None, (Path(library).resolve() if library else default_library())

    def _queued_root(self, key: str, hm: bool, library: str, verify: bool) -> Path | None:
        if verify:
            installed = installed_path(key, hm)
            return installed.parent.resolve() if installed is not None else None
        return self._resolve_root(key, hm, library)[1].resolve()

    def _start_next(self) -> None:
        if self._paused:
            return
        account = get_setting(self._settings, "steam_account", "")
        if not account or not NAME_PATTERN.match(account):
            return
        while (self._queue and not self._running and not self._picking
               and self._pending_request is None):
            season_key, enable_hm, library, verify = self._queue[0]
            if (season_key == self._deleting_key or self._updater.busy
                    or self._uninstaller.busy_key() == season_key
                    or self._shears.busy_key() == season_key
                    or self._settings_bridge.clearing_cache()
                    or (verify and is_season_running(season_key))):
                return
            self._queue.pop(0)
            self._queue_updated()
            if verify:
                self._verify(season_key, enable_hm)
            else:
                self._start(season_key, enable_hm, library)

    def _start(self, season_key: str, enable_hm: bool, library: str,
               skip_disk_check: bool = False) -> None:
        self._dequeue(season_key, enable_hm)
        download = self._accept(season_key, ("start", season_key, enable_hm, library))
        if download is None:
            return
        partial, root = self._resolve_root(season_key, enable_hm, library)
        if partial is not None:
            target = partial
            if library and Path(library).resolve() != root:
                self.error.emit("A partial download exists")
                return
        else:
            if installed_path(season_key, enable_hm) is not None:
                self.error.emit("Already installed")
                return
            if root not in libraries():
                self.error.emit("Unknown library")
                return
            if not root.exists():
                self.error.emit("Folder not found, is the drive connected?")
                return
            target = root / edition_folder(season_key, enable_hm)
        if enable_hm and not self._ensure_hm_archive(download):
            return
        if not skip_disk_check:
            required = download["size_gb"] * 2**30 + _STAGING_HEADROOM
            free = shutil.disk_usage(target.parent).free
            if free < required:
                self._pending_request = ("disk", season_key, enable_hm, library)
                self._persist_queue()
                self.disk_space_required.emit(
                    math.ceil((required - free) / 2**30 * 10) / 10)
                return
        self._launch(download, season_key, target, enable_hm, verify=False)

    @Slot(str, bool)
    def delete_partial(self, season_key: str, hm: bool) -> None:
        QTimer.singleShot(0, lambda: self._delete_partial(season_key, hm))

    def _delete_partial(self, season_key: str, hm: bool) -> None:
        if self._running and (season_key, hm) == (self._active_key, self._enable_hm):
            self.partial_deleted.emit(
                season_key, hm, False, BUSY_MESSAGE
            )
            return
        if self._deleting_key is not None:
            self.partial_deleted.emit(season_key, hm, False, REMOVING_FILES)
            return
        installed = installed_path(season_key, hm)
        folder = edition_folder(season_key, hm)
        targets = [
            path
            for root in libraries()
            if (path := root / folder).is_dir() and path != installed
        ]
        code = season_key.split("_", 1)[0]
        removed_message = f"{code} download removed"
        if not targets:
            if not self._running and (season_key, hm) == (self._active_key, self._enable_hm):
                self._on_deleted(season_key, hm, True, removed_message)
            else:
                self.partial_deleted.emit(season_key, hm, False, "Nothing to remove")
            return
        self._deleting_key = season_key

        def work() -> None:
            try:
                for path in targets:
                    shutil.rmtree(path)
            except OSError as e:
                self._deleted_in.emit(season_key, hm, False, log.fail("Remove failed", e))
            else:
                self._deleted_in.emit(season_key, hm, True, removed_message)

        threading.Thread(target=work, daemon=True).start()

    def _on_deleted(self, season_key: str, hm: bool, ok: bool, message: str) -> None:
        self._deleting_key = None
        if (ok and not self._running
                and (season_key, hm) == (self._active_key, self._enable_hm)):
            if self._paused and self._enter_paused_from_queue():
                self._set_state("paused")
            else:
                self._active_key = ""
                self._set_state("idle")
                self._clear_paused_flag()
            self.active_key_changed.emit()
            self._queue_updated()
        self.partial_deleted.emit(season_key, hm, ok, message)
        self._start_next()

    @Slot(str, bool)
    def verify(self, season_key: str, hm: bool) -> None:
        QTimer.singleShot(0, lambda: self._verify(season_key, hm))

    def _verify(self, season_key: str, hm: bool) -> None:
        if self._running:
            if self._active_or_queued(season_key, hm):
                return
            if installed_path(season_key, hm) is None:
                self.error.emit("Not installed")
                return
            self._queue.append((season_key, hm, "", True))
            self._queue_updated()
            return
        download = self._accept(season_key, ("verify", season_key, hm))
        if download is None:
            return
        target = installed_path(season_key, hm)
        if target is None:
            self.error.emit("Not installed")
            return
        if hm and not self._ensure_hm_archive(download):
            return

        def pre() -> None:
            stop_game(season_pids(season_key))
            if is_season_running(season_key):
                raise OSError(SEASON_RUNNING)

        self._launch(download, season_key, target, hm, verify=True, pre=pre)

    def _clear_paused_flag(self) -> None:
        if self._paused:
            self._paused = False
            set_setting(self._settings, "queue_paused", False)
            save_settings(self._settings)

    def _requeue_paused(self, season_key: str, enable_hm: bool) -> None:
        if (self._state == "paused" and self._active_key
                and (self._active_key, self._enable_hm) != (season_key, enable_hm)):
            self._queue.insert(
                0,
                (self._active_key, self._enable_hm, str(self._target.parent), False),
            )
            self.queue_changed.emit()
        self._clear_paused_flag()

    def _pick_hm_archive(self) -> bool:
        self._picking = True
        try:
            picked = pick_file("Choose the Heated Metal archive", ".7z archive (*.7z)")
        finally:
            self._picking = False
        if not picked:
            return False
        try:
            cached = cache_hm_archive(Path(picked))
        except OSError as e:
            self.error.emit(log.fail("Could not store the Heated Metal archive", e))
            return False
        self._picked_archive = cached
        set_setting(self._settings, "hm_archive", cached.name)
        save_settings(self._settings)
        return True

    def _ensure_hm_archive(self, download: dict) -> bool:
        if not download.get("hm_beta") or self._picked_archive is not None:
            return True
        cached = BIN_DIR / Path(str(get_setting(self._settings, "hm_archive", ""))).name
        if cached.is_file():
            self._picked_archive = cached
            return True
        return self._pick_hm_archive()

    def _begin_run(self, download: dict, season_key: str, target: Path,
                   enable_hm: bool, verify: bool, state: str, username: str = "") -> None:
        self._generation += 1
        self._download = download
        self._switching = ""
        self._set_enable_hm(enable_hm)
        self._set_verifying(verify)
        self._target = target
        self._archive = self._picked_archive
        self._picked_archive = None
        self._username = username
        self._cancelled = False
        self._rate_limit_hit = False
        self._history.clear()
        if self._active_key != season_key:
            self._active_key = season_key
            self.active_key_changed.emit()
        self._set_progress(0.0)
        self._set_step(0, 0)
        self._set_state(state)
        self._set_running(True)
        self._persist_queue()

    def _launch(self, download: dict, season_key: str, target: Path,
                enable_hm: bool, verify: bool,
                pre: Callable[[], None] | None = None, username: str = "") -> None:
        self._requeue_paused(season_key, enable_hm)
        value = get_setting(self._settings, "max_downloads", DEFAULT_MAX_DOWNLOADS)
        self._max_downloads = value if isinstance(value, int) else DEFAULT_MAX_DOWNLOADS
        self._begin_run(download, season_key, target, enable_hm, verify, "preparing", username)
        threading.Thread(
            target=self._prepare,
            args=(self._generation, enable_hm, pre),
            daemon=True,
        ).start()

    def _prepare(self, generation: int, enable_hm: bool,
                 pre: Callable[[], None] | None) -> None:
        try:
            if pre is not None:
                pre()
        except OSError as e:
            self._prepare_done_in.emit(generation, "", str(e))
            return
        except Exception as e:
            self._prepare_done_in.emit(generation, "", log.fail("Setup failed", e))
            return
        try:
            dd = ensure_depotdownloader()
            if not enable_hm:
                ensure_tl()
        except RateLimited as e:
            self._rate_limited_in.emit(e.message())
            self._prepare_done_in.emit(generation, "", str(e))
        except OSError as e:
            self._prepare_done_in.emit(generation, "", str(e))
        else:
            self._prepare_done_in.emit(generation, str(dd), "")

    def _on_prepare_done_in(self, generation: int, dd: str, err: str) -> None:
        if generation != self._generation:
            return
        if self._cancelled:
            self._end_run(1)
            return
        if err:
            if not self._rate_limit_hit:
                self.error.emit(err)
            self._end_run(1)
            return
        self._dd = dd
        try:
            self._commands = depot_commands(
                self._download, self._steam_account, self._target, self._max_downloads
            )
            self._target.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            self.error.emit(log.fail("Setup failed", e))
            self._end_run(1)
            return
        self._set_state("downloading")
        self._index = 0
        self._run_next()

    def _run_next(self) -> None:
        if self._index >= len(self._commands):
            self._set_progress(100.0)
            self._start_apply()
            return
        cmd = self._commands[self._index]
        self._set_step(self._index + 1, len(self._commands))
        self._set_progress(0.0)
        self._buffer = ""
        self._login_pending = False
        self._proc_done = False
        proc = QProcess(self)
        proc.setProcessChannelMode(QProcess.MergedChannels)
        proc.readyReadStandardOutput.connect(self._on_output)
        proc.finished.connect(self._on_process_finished)
        proc.errorOccurred.connect(self._on_process_error)
        self._process = proc
        proc.start(self._dd, cmd["args"])

    def _on_output(self) -> None:
        proc = self.sender()
        if proc is None or proc is not self._process:
            return
        self._buffer += bytes(proc.readAllStandardOutput()).decode("utf-8", errors="replace")
        *split, self._buffer = self._buffer.split("\n")
        lines = [line.rstrip("\r") for line in split]
        for line in lines:
            match = _PERCENT.match(line)
            if match and self._commands:
                depot_pct = min(float(match.group(1)), 100.0)
                if depot_pct - self._progress >= 0.1:
                    self._set_progress(depot_pct)
        if lines:
            self.log_line.emit("\n".join(lines))
        self._check_prompt(self._buffer)

    def _check_prompt(self, text: str) -> None:
        if self._login_pending:
            return
        stripped = text.rstrip()
        if not stripped.endswith(":"):
            return
        low = stripped.lower()
        if any(token in low for token in ("auth code", "2-factor", "two-factor", "steam guard")):
            kind = "guard_email" if "email" in low else "guard"
        elif "password" in low:
            kind = "password"
        else:
            return
        self._login_pending = True
        if kind == "password" and self._pending_password and self._process is not None:
            password = self._pending_password
            self._pending_password = ""
            self._login_pending = False
            self._process.write((password + "\n").encode())
            return
        self._login_kind = kind
        self.login_required.emit(kind)

    @Slot(str)
    def submit_login(self, text: str) -> None:
        if self._process is None or not self._login_pending:
            return
        self._login_pending = False
        self._login_kind = ""
        self._process.write((text + "\n").encode())

    @Slot(str, str)
    def submit_account_login(self, account: str, password: str) -> None:
        account = account.strip()
        if not account or not NAME_PATTERN.match(account):
            self.error.emit("Invalid Steam account")
            return
        self._login_kind = ""
        self._settings_bridge.set_steam_account(account)
        self._pending_password = password
        request = self._pending_request
        self._pending_request = None
        if request is None:
            return
        kind, *rest = request
        if kind == "verify":
            self._verify(*rest)
        elif kind == "remove_hm":
            self._remove_hm(*rest)
        else:
            self._start(*rest)

    @Slot()
    def confirm_disk_space(self) -> None:
        request = self._pending_request
        if request is None or request[0] != "disk":
            return
        self._pending_request = None
        _, *rest = request
        self._start(*rest, skip_disk_check=True)

    def _on_process_finished(self, code: int, status: QProcess.ExitStatus) -> None:
        proc = self.sender()
        if proc is not self._process:
            if isinstance(proc, QProcess):
                proc.deleteLater()
            return
        if self._proc_done:
            return
        self._proc_done = True
        self._process = None
        proc.deleteLater()
        if self._cancelled:
            self._end_run(1)
            return
        if status == QProcess.ExitStatus.CrashExit:
            self.error.emit("DepotDownloader stopped unexpectedly")
            self._end_run(1)
            return
        cmd = self._commands[self._index]
        if code != 0:
            if not cmd["optional"]:
                self.error.emit(f"{cmd['name']} depot failed, exit code {code}")
                self._end_run(code)
                return
            self.warning.emit(f"{cmd['name']} depot failed")
        self._index += 1
        self._run_next()

    def _on_process_error(self, err: QProcess.ProcessError) -> None:
        proc = self.sender()
        if proc is not self._process or self._proc_done:
            return
        if err != QProcess.ProcessError.FailedToStart:
            return
        self._proc_done = True
        self._process = None
        proc.deleteLater()
        self.error.emit("DepotDownloader failed to start")
        self._end_run(1)

    def _start_apply(self) -> None:
        self._set_step(0, 0)
        self._set_state("applying")
        username = (installed_username(self._target) or self._username
                    or get_setting(self._settings, "username", DEFAULT_USERNAME))
        threading.Thread(
            target=self._apply,
            args=(self._generation, self._target, self._download, self._enable_hm, username,
                  self._verifying, self._archive),
            daemon=True,
        ).start()

    def _apply(self, generation: int, target: Path, download: dict, is_hm: bool,
               username: str, verify: bool, archive: Path | None) -> None:
        reporter = SignalReporter(fail_emit=self._error_in.emit)
        try:
            ok = _apply_install(target, download, is_hm, username,
                               include_launcher=not verify, reporter=reporter,
                               archive=archive)
            if ok and verify and not is_hm and not (target / TL_LAUNCHER).exists():
                write_launcher(target, reporter)
        except RateLimited as e:
            self._rate_limited_in.emit(e.message())
            ok = False
        except Exception as e:
            self._error_in.emit(log.fail("Install failed", e))
            ok = False
        self._apply_done_in.emit(generation, ok)

    def _on_apply_done_in(self, generation: int, ok: bool) -> None:
        if generation != self._generation:
            return
        if ok:
            self._cancelled = False
            self._end_run(0)
        else:
            self._end_run(1)

    def _blocked(self, season_key: str) -> bool:
        if self._running:
            self.error.emit(DOWNLOAD_RUNNING)
            return True
        if self._picking:
            return True
        if self._deleting_key is not None:
            self.error.emit(REMOVING_FILES)
            return True
        return self._conflicts(season_key)

    @Slot(str)
    def switch_to_hm(self, season_key: str) -> None:
        QTimer.singleShot(0, lambda: self._switch_to_hm(season_key))

    def _switch_to_hm(self, season_key: str) -> None:
        if self._blocked(season_key):
            return
        folder = installed_path(season_key, False)
        if folder is None:
            self.error.emit("Not installed as Throwback")
            return
        download = next((d for d in self._downloads if d["key"] == season_key), None)
        if download is None or not download.get("hm"):
            self.error.emit("Heated Metal is not available for this season")
            return
        if installed_path(season_key, True) is not None:
            self.error.emit("Heated Metal is already installed")
            return
        if partial_path(season_key, True) is not None:
            self.error.emit("A partial download exists")
            return
        if is_season_running(season_key):
            self.error.emit(SEASON_RUNNING)
            return
        if not self._ensure_hm_archive(download):
            return
        self._dequeue(season_key, True)
        self._requeue_paused(season_key, True)
        target = folder.parent / edition_folder(season_key, True)
        self._begin_run(download, season_key, target, True, False, "applying")
        self._switching = "hm"
        threading.Thread(
            target=self._switch_worker,
            args=(self._generation, folder, self._target, download, self._archive),
            daemon=True,
        ).start()

    def _switch_worker(self, generation: int, folder: Path, target: Path, download: dict,
                       archive: Path | None) -> None:
        reporter = SignalReporter(fail_emit=self._error_in.emit)
        username = installed_username(folder) or get_setting(
            self._settings, "username", DEFAULT_USERNAME
        )
        try:
            folder.rename(target)
            for name in TL_EXTRACT:
                (target / name).unlink(missing_ok=True)
            ok = _apply_install(target, download, True, username, reporter=reporter,
                               archive=archive)
        except RateLimited as e:
            self._rate_limited_in.emit(e.message())
            ok = False
        except Exception as e:
            self._error_in.emit(log.fail("Switch failed", e))
            ok = False
        self._apply_done_in.emit(generation, ok)

    @Slot(str)
    def remove_hm(self, season_key: str) -> None:
        QTimer.singleShot(0, lambda: self._remove_hm(season_key))

    def _remove_hm(self, season_key: str) -> None:
        download = self._accept(season_key, ("remove_hm", season_key))
        if download is None:
            return
        folder = installed_path(season_key, True)
        if folder is None:
            self.error.emit("Not installed as Heated Metal")
            return
        if installed_path(season_key, False) is not None:
            self.error.emit("Already installed as Throwback")
            return
        if partial_path(season_key, False) is not None:
            self.error.emit("A partial download exists")
            return
        if is_season_running(season_key):
            self.error.emit(SEASON_RUNNING)
            return
        self._dequeue(season_key, False)
        target = folder.parent / season_key
        username = installed_username(folder)

        def pre() -> None:
            try:
                folder.rename(target)
                remove_hm_files(target)
            except OSError as e:
                raise OSError(log.fail("Switch failed", e)) from e

        self._launch(download, season_key, target, False, verify=True, pre=pre,
                     username=username)
        self._switching = "tb"

    @Slot(str)
    def import_hm(self, season_key: str) -> None:
        QTimer.singleShot(0, lambda: self._import_hm(season_key))

    def _import_hm(self, season_key: str) -> None:
        if self._blocked(season_key):
            return
        target = installed_path(season_key, True)
        if target is None:
            self.error.emit("Not installed as Heated Metal")
            return
        download = next((d for d in self._downloads if d["key"] == season_key), None)
        if download is None or not download.get("hm_beta"):
            self.error.emit("Heated Metal beta is not available for this season")
            return
        if is_season_running(season_key):
            self.error.emit(SEASON_RUNNING)
            return
        if not self._pick_hm_archive():
            return
        self._requeue_paused(season_key, True)
        self._begin_run(download, season_key, target, True, False, "applying")
        self._start_apply()

    @Slot()
    def cancel(self) -> None:
        QTimer.singleShot(0, self._cancel)

    def _cancel(self) -> None:
        if not self._running:
            request = self._pending_request
            self._pending_request = None
            self._login_kind = ""
            self._pending_password = ""
            self._picked_archive = None
            if request is not None and request[0] == "disk":
                self._persist_queue()
                QTimer.singleShot(0, self._start_next)
            return
        self._cancelled = True
        proc = self._process
        if proc is not None and proc.state() != QProcess.ProcessState.NotRunning:
            proc.kill()

    def shutdown(self) -> None:
        proc = self._process
        if proc is not None and proc.state() != QProcess.ProcessState.NotRunning:
            self._proc_done = True
            proc.kill()
            proc.waitForFinished(2000)

    def _on_rate_limited_in(self, message: str) -> None:
        self._rate_limit_hit = True
        self.rate_limited.emit(message)

    @Slot()
    def request_log(self) -> None:
        self.log_history.emit(self._active_key, "\n".join(self._history))

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return {
            "state": self._state,
            "progress": self._progress,
            "step": self._step,
            "steps": self._steps,
            "running": self._running,
            "activeKey": self._active_key,
            "activeHm": self._enable_hm,
            "verifying": self._verifying,
            "loginKind": self._login_kind,
            "queue": self.queued_items(),
        }

    def _end_run(self, code: int) -> None:
        if self._process is not None:
            self._process.deleteLater()
            self._process = None
        self._login_pending = False
        self._login_kind = ""
        self._pending_password = ""
        self._pending_request = None
        self._buffer = ""
        done_key = self._active_key
        verifying = self._verifying
        self._set_verifying(False)
        if self._cancelled:
            outcome = ""
            keep_active = bool(self._active_key) and not verifying
            if self._paused and (keep_active or self._enter_paused_from_queue()):
                self._set_state("paused")
                if not keep_active:
                    self.active_key_changed.emit()
                    self.queue_changed.emit()
            else:
                self._clear_paused_flag()
                self._set_state("idle")
                if self._active_key:
                    self._active_key = ""
                    self.active_key_changed.emit()
        elif code != 0:
            outcome = ("rate_limited" if self._rate_limit_hit
                       else "no_space" if _out_of_space(self._target.parent)
                       else "verify_failed" if verifying else "failed")
            self._set_state("failed")
        else:
            outcome = (f"switched_{self._switching}" if self._switching
                       else "verified" if verifying else "done")
            if self._paused and self._enter_paused_from_queue():
                self._set_state("paused")
                self.active_key_changed.emit()
                self.queue_changed.emit()
            else:
                self._set_state(outcome)
                self._clear_paused_flag()
        self._set_running(False)
        self._persist_queue()
        self.done.emit(done_key, outcome)
        if self._queue:
            QTimer.singleShot(0, self._start_next)
