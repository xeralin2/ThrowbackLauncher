import threading
from collections.abc import Callable

from PySide6.QtCore import QObject, QTimer, Signal, Slot

from core import log
from core.steam import uninstall, uninstall_item, uninstall_targets

BLOCKED_MESSAGE = "Verify is running, wait for it to finish"


class UninstallController(QObject):
    done = Signal(bool, str)
    item_done = Signal(str, bool, str)
    _done_in = Signal(bool, str)
    _item_done_in = Signal(str, bool, str)

    def __init__(self, downloader: QObject, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._downloader = downloader
        self._busy_key: str | None = None
        self._done_in.connect(self._on_done)
        self._item_done_in.connect(self._on_item_done)

    def busy_key(self) -> str | None:
        return self._busy_key

    def _on_done(self, ok: bool, message: str) -> None:
        self._busy_key = None
        self.done.emit(ok, message)

    def _on_item_done(self, item: str, ok: bool, message: str) -> None:
        self._busy_key = None
        self.item_done.emit(item, ok, message)

    def _blocked(self, key: str) -> bool:
        return bool(self._downloader.property("running")) and key == self._downloader.property(
            "active_key"
        )

    @Slot(str, bool, result="QVariantMap")
    def preview(self, key: str, hm: bool) -> dict:
        targets = uninstall_targets(key, hm)
        if targets is None:
            return {"folder": "", "prefix": ""}
        return targets

    @Slot(str, bool)
    def run(self, key: str, hm: bool) -> None:
        QTimer.singleShot(0, lambda: self._dispatch(
            key, lambda: uninstall(key, hm), "Uninstall failed", self._done_in.emit))

    @Slot(str, bool, str)
    def run_item(self, key: str, hm: bool, item: str) -> None:
        QTimer.singleShot(0, lambda: self._dispatch(
            key, lambda: uninstall_item(key, hm, item), "Delete failed",
            lambda ok, message: self._item_done_in.emit(item, ok, message)))

    def _dispatch(self, key: str, action: Callable[[], dict], label: str,
                  emit: Callable[[bool, str], None]) -> None:
        if self._busy_key is not None:
            return
        if self._blocked(key):
            emit(False, BLOCKED_MESSAGE)
            return
        self._busy_key = key

        def work() -> None:
            try:
                result = action()
            except Exception as e:
                result = {"ok": False, "message": log.fail(label, e)}
            emit(bool(result.get("ok")), str(result.get("message", "")))

        threading.Thread(target=work, daemon=True).start()
