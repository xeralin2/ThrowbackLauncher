import threading

from PySide6.QtCore import QObject, QTimer, Signal

from core.steam import running_game_folders


class Watchdog(QObject):
    tick = Signal(object)
    _scanned = Signal(object)
    _poked = Signal()

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._folders: dict[str, list[int]] = {}
        self._scanning = False
        self._rescan = False
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._scan)
        self._scanned.connect(self._on_scanned)
        self._poked.connect(self._scan)

    def start(self) -> None:
        self._timer.start(2000)
        self._scan()

    def poke(self) -> None:
        self._poked.emit()

    def folders(self) -> dict[str, list[int]]:
        return self._folders

    def _scan(self) -> None:
        if self._scanning:
            self._rescan = True
            return
        self._scanning = True
        threading.Thread(target=self._scan_worker, daemon=True).start()

    def _scan_worker(self) -> None:
        try:
            folders = running_game_folders()
        except Exception:
            folders = {}
        self._scanned.emit(folders)

    def _on_scanned(self, folders: dict) -> None:
        self._scanning = False
        self._folders = folders
        self.tick.emit(folders)
        if self._rescan:
            self._rescan = False
            self._scan()
