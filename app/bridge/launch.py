import os
import subprocess
import threading
import time

from PySide6.QtCore import QObject, Signal, Slot

from core import log
from core.constants import IS_WINDOWS, PREFIX_DIR
from core.manifest import (
    hm_folder_name,
    installed_path,
    launcher_name,
    partial_path,
    resolve_install,
)
from core.steam import (
    GAME_RUNNING,
    NO_PROTON,
    is_game_running,
    is_season_running,
    prefix_pids,
    proton_env,
    resolve_proton,
    running_game_folders,
    stop_game,
)


class LaunchController(QObject):
    error = Signal(str)
    running_changed = Signal("QVariantList")
    launching_changed = Signal("QVariantMap")

    def __init__(self, settings: dict, downloads: list[dict],
                 watchdog: QObject) -> None:
        super().__init__()
        self._settings = settings
        self._downloads = downloads
        self._watchdog = watchdog
        self._running_pairs: set[tuple[str, bool]] = set()
        self._launching: tuple[str, bool] | None = None
        self._launch_deadline = 0.0
        watchdog.tick.connect(self._on_tick)

    def _on_tick(self, folders: object) -> None:
        pairs = set()
        for folder in folders:
            resolved = resolve_install(folder, self._downloads)
            if resolved is not None:
                pairs.add((resolved[0]["key"], resolved[1]))
        if pairs != self._running_pairs:
            closed = {key for key, _ in self._running_pairs} - {key for key, _ in pairs}
            self._running_pairs = pairs
            self.running_changed.emit(self._running_list())
            for key in closed:
                threading.Thread(target=self._on_closed, args=(key,), daemon=True).start()
        if self._launching is not None and (
            self._launching in pairs or time.monotonic() >= self._launch_deadline
        ):
            self._set_launching(None)

    def _running_list(self) -> list:
        return [{"key": key, "hm": hm} for key, hm in sorted(self._running_pairs)]

    def _launching_map(self) -> dict:
        if self._launching is None:
            return {}
        key, hm = self._launching
        return {"key": key, "hm": hm}

    def _set_launching(self, value: tuple[str, bool] | None) -> None:
        if value != self._launching:
            self._launching = value
            self.launching_changed.emit(self._launching_map())

    @Slot(result="QVariantList")
    def running(self) -> list:
        return self._running_list()

    @Slot(result="QVariantMap")
    def launching(self) -> dict:
        return self._launching_map()

    @Slot(str, result="QVariantMap")
    def status(self, key: str) -> dict:
        def variant(hm: bool) -> dict:
            if installed_path(key, hm) is not None:
                return {"installed": True, "partial": False}
            return {"installed": False, "partial": partial_path(key, hm) is not None}

        return {"tb": variant(False), "hm": variant(True)}

    @Slot(str, bool)
    def launch(self, key: str, hm: bool) -> None:
        if self._launching is not None:
            self.error.emit("Rainbow Six Siege is launching")
            return
        if is_game_running():
            self.error.emit(GAME_RUNNING)
            return
        folder = installed_path(key, hm)
        if folder is None:
            self.error.emit("Not installed")
            return
        launcher = folder / launcher_name(hm)
        if IS_WINDOWS:
            try:
                os.startfile(str(launcher), cwd=str(folder))
            except OSError as e:
                self.error.emit(log.fail("Launch failed", e))
            else:
                self._begin_launch(key, hm)
            return
        proton = resolve_proton(self._settings)
        if proton is None:
            self.error.emit(NO_PROTON)
            return
        prefix = PREFIX_DIR / key
        try:
            env = proton_env(prefix)
            (prefix / ".keep").unlink(missing_ok=True)
            subprocess.Popen(
                [str(proton["binary"]), "run", str(launcher)],
                cwd=str(folder),
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except OSError as e:
            self.error.emit(log.fail("Launch failed", e))
        else:
            self._begin_launch(key, hm)

    def _begin_launch(self, key: str, hm: bool) -> None:
        self._launch_deadline = time.monotonic() + 30
        self._set_launching((key, hm))

    @Slot(str)
    def stop(self, key: str) -> None:
        threading.Thread(target=self._stop, args=(key,), daemon=True).start()

    def _stop(self, key: str) -> None:
        if IS_WINDOWS:
            names = {key, hm_folder_name(key)}
            pids = [
                pid
                for folder, folder_pids in running_game_folders().items()
                if folder in names
                for pid in folder_pids
            ]
            if pids:
                stop_game(pids)
        else:
            self._clear_prefix(key)
        self._watchdog.poke()

    def _on_closed(self, key: str) -> None:
        if is_season_running(key):
            return
        self._clear_prefix(key)

    def _clear_prefix(self, key: str) -> None:
        if IS_WINDOWS:
            return
        pids = prefix_pids(PREFIX_DIR / key)
        if pids:
            stop_game(pids)
