import threading
from pathlib import Path

from PySide6.QtCore import QObject, Signal, Slot

from bridge.dialogs import pick_file
from core import log
from core.cheatengine import (
    CE_MARKER,
    add_cheat_engine,
    is_cheat_engine_present,
    register_cheat_engine,
    remove_cheat_engine,
)
from core.manifest import installed_tb_downloads
from core.throwbackloader import read_tl_tools


class CheatEngine(QObject):
    done = Signal(bool, str)
    _done_in = Signal(bool, str)

    def __init__(self, settings: dict, downloads: list[dict],
                 parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._settings = settings
        self._downloads = downloads
        self._installer = ""
        self._busy = False
        self._done_in.connect(self._on_done)

    def _on_done(self, ok: bool, message: str) -> None:
        self._busy = False
        self.done.emit(ok, message)

    @Slot(result=str)
    def pick_installer(self) -> str:
        picked = pick_file("Choose the Cheat Engine installer", ".exe installer (*.exe)")
        if picked:
            self._installer = picked
        return self._installer

    @Slot(result="QVariantList")
    def seasons(self) -> list:
        result = []
        for folder, download in installed_tb_downloads(self._downloads):
            key = download["key"]
            has_ce = any(CE_MARKER in t.lower() for t in read_tl_tools(folder))
            result.append({
                "key": key,
                "label": download["label"],
                "hasCe": has_ce,
                "present": is_cheat_engine_present(key),
            })
        return result

    @Slot(str, result="QVariantMap")
    def register(self, key: str) -> dict:
        try:
            register_cheat_engine(key)
        except Exception as e:
            return {"ok": False, "message": log.fail("Cheat Engine setup failed", e)}
        return {"ok": True, "message": "Cheat Engine added"}

    @Slot(str, result="QVariantMap")
    def remove(self, key: str) -> dict:
        try:
            remove_cheat_engine(key)
        except Exception as e:
            return {"ok": False, "message": log.fail("Cheat Engine removal failed", e)}
        return {"ok": True, "message": "Cheat Engine removed"}

    @Slot(str)
    def install(self, key: str) -> None:
        if self._busy or not self._installer:
            return
        self._busy = True
        installer = Path(self._installer)
        threading.Thread(target=self._install, args=(key, installer), daemon=True).start()

    def _install(self, key: str, installer: Path) -> None:
        try:
            add_cheat_engine(key, installer, self._settings)
        except Exception as e:
            self._done_in.emit(False, log.fail("Cheat Engine setup failed", e))
        else:
            self._done_in.emit(True, "Cheat Engine added")
