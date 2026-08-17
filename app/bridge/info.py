import threading
from pathlib import Path

from PySide6.QtCore import QObject, QUrl, Signal, Slot
from PySide6.QtGui import QDesktopServices

from core import settings
from core.manifest import installed_path, local_downloads
from core.shears import folder_size
from layout import VERSION


class InfoController(QObject):
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
        if target in settings.libraries() and target.exists():
            QDesktopServices.openUrl(QUrl.fromLocalFile(str(target)))

    @Slot(str, bool)
    def open_season(self, key: str, hm: bool) -> None:
        target = installed_path(key, hm)
        if target is not None:
            QDesktopServices.openUrl(QUrl.fromLocalFile(str(target)))
