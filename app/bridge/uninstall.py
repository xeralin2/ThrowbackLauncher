import threading

from PySide6.QtCore import QObject, QTimer, Signal, Slot

from core import log
from core.constants import BUSY_MESSAGE, UPDATE_RUNNING
from core.steam import uninstall


class UninstallController(QObject):
    done = Signal(bool, str)
    _done_in = Signal(bool, str)

    def __init__(self, downloader: QObject, updater: QObject,
                 parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._downloader = downloader
        self._updater = updater
        self._busy_key: str | None = None
        self._done_in.connect(self._on_done)

    def busy_key(self) -> str | None:
        return self._busy_key

    def _on_done(self, ok: bool, message: str) -> None:
        self._busy_key = None
        self.done.emit(ok, message)

    @Slot(str, bool)
    def run(self, key: str, hm: bool) -> None:
        QTimer.singleShot(0, lambda: self._dispatch(key, hm))

    def _dispatch(self, key: str, hm: bool) -> None:
        emit = self._done_in.emit
        if self._busy_key is not None:
            return
        if self._downloader.busy_with(key):
            emit(False, BUSY_MESSAGE)
            return
        if self._updater.busy:
            emit(False, UPDATE_RUNNING)
            return
        self._busy_key = key

        def work() -> None:
            try:
                result = uninstall(key, hm)
            except Exception as e:
                result = {"ok": False, "message": log.fail("Uninstall failed", e)}
            emit(bool(result.get("ok")), str(result.get("message", "")))

        threading.Thread(target=work, daemon=True).start()
