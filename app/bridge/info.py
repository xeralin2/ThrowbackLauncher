import threading
from pathlib import Path

from PySide6.QtCore import QObject, QUrl, Signal, Slot
from PySide6.QtGui import QDesktopServices

from core import settings
from core.constants import VERSION
from core.manifest import local_downloads
from core.settings import libraries
from core.shears import folder_size


class Info(QObject):
    disk_usage_changed = Signal(float)

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return {"version": VERSION, "warning": settings.warning}

    @Slot()
    def refresh_disk_usage(self) -> None:
        threading.Thread(target=self._emit_disk_usage, daemon=True).start()

    def _emit_disk_usage(self) -> None:
        total = sum(folder_size(folder) for folder in local_downloads())
        self.disk_usage_changed.emit(round(total / 2**30, 1))

    @Slot(str)
    def open_library(self, path: str) -> None:
        target = Path(path)
        if target in libraries() and target.exists():
            QDesktopServices.openUrl(QUrl.fromLocalFile(str(target)))
