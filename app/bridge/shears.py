import threading

from PySide6.QtCore import QObject, Signal, Slot

from core import log
from core.constants import EVENT_SEASONS, TEXTURE_QUALITIES
from core.manifest import installed_path
from core.shears import cut_download, scan_download
from core.steam import is_season_running

_KINDS = ("videos", "events", "textures")


def _empty() -> dict:
    return {"videos": 0, "events": 0, "tiers": []}


def _fail(key: str, message: str) -> dict:
    return {"key": key, "ok": False, "message": message, "freed": 0, "scan": _empty()}


def _serialize(scan: dict) -> dict:
    return {
        "videos": scan["videos"],
        "events": scan["events"],
        "tiers": [
            {"level": level, "quality": TEXTURE_QUALITIES[level], "size": size}
            for level, size in sorted(scan["tiers"].items())
        ],
    }


class Shears(QObject):
    scan_done = Signal("QVariantMap")
    cut_done = Signal("QVariantMap")

    def __init__(self, downloader: QObject, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._downloader = downloader

    @Slot(str)
    def scan(self, key: str) -> None:
        threading.Thread(target=self._scan, args=(key,), daemon=True).start()

    def _scan(self, key: str) -> None:
        try:
            path = installed_path(key, False)
            if path is None:
                self.scan_done.emit({"key": key, "ok": True, "message": "", "scan": _empty()})
                return
            scan = _serialize(scan_download(path, EVENT_SEASONS.get(key)))
            self.scan_done.emit({"key": key, "ok": True, "message": "", "scan": scan})
        except Exception as e:
            self.scan_done.emit(
                {"key": key, "ok": False, "message": log.fail("Shears failed", e), "scan": _empty()}
            )

    @Slot(str, str, int)
    def cut(self, key: str, kind: str, level: int) -> None:
        threading.Thread(target=self._cut, args=(key, kind, level), daemon=True).start()

    def _cut(self, key: str, kind: str, level: int) -> None:
        if kind not in _KINDS:
            self.cut_done.emit(_fail(key, "Invalid target"))
            return
        if (bool(self._downloader.property("running"))
                and self._downloader.property("active_key") == key):
            self.cut_done.emit(_fail(key, "Verify is running, wait for it to finish"))
            return
        try:
            path = installed_path(key, False)
            if path is None:
                self.cut_done.emit(_fail(key, "Not available"))
                return
            if is_season_running(key):
                self.cut_done.emit(_fail(key, "Close this season first"))
                return
            if kind == "events" and key not in EVENT_SEASONS:
                self.cut_done.emit(_fail(key, "Not available"))
                return
            freed = cut_download(path, kind, level, EVENT_SEASONS.get(key))
            self.cut_done.emit({
                "key": key,
                "ok": True,
                "message": "",
                "freed": freed,
                "scan": _serialize(scan_download(path, EVENT_SEASONS.get(key))),
            })
        except Exception as e:
            self.cut_done.emit(_fail(key, log.fail("Shears failed", e)))
