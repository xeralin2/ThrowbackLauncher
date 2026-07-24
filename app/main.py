import contextlib
import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIR))

from core.constants import IS_WINDOWS
from core.self_update import maybe_apply_pending, run_relaunch

if IS_WINDOWS and "--relaunch" in sys.argv:
    sys.exit(run_relaunch(sys.argv))

if "--uninstall" in sys.argv:
    from core.self_uninstall import run as _run_uninstall

    _run_uninstall()
    sys.exit(0)

if maybe_apply_pending():
    sys.exit(0)

import threading

from PySide6.QtCore import QLockFile, QObject
from PySide6.QtGui import QIcon
from PySide6.QtNetwork import QLocalServer, QLocalSocket
from PySide6.QtWidgets import QApplication, QMessageBox

from core import log
from core.constants import (
    DATA_ROOT,
    DEFAULT_DOWNLOADS_DIR,
    DIR_NAME,
    FROZEN,
    ICON_FILE,
    INSTANCE_KEY,
    NEXT_OUT_DIR,
)
from core.manifest import load_downloads
from core.rpc import is_discord_installed
from core.steam import prune_prefixes
from core.settings import get_setting, load_settings
from core import rvpn as rvpn_core

from app_window import BrowserView
from bridge.cheatengine import CheatEngine
from bridge.downloader import DownloadController
from bridge.forward import EventForwarder
from bridge.info import Info
from bridge.launch import LaunchController
from bridge.library import Library
from bridge.liberator import LiberatorController
from bridge.rvpn import RvpnController
from bridge.rpc import RpcController
from bridge.settings import Settings
from bridge.shears import Shears
from bridge.uninstall import UninstallController
from bridge.update import UpdateController
from server import StaticServer
from watchdog import Watchdog

CA_BUNDLES = (
    "/etc/ssl/certs/ca-certificates.crt",
    "/etc/pki/tls/certs/ca-bundle.crt",
    "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem",
    "/etc/ssl/ca-bundle.pem",
)


FORWARDS = {
    "downloader": {
        "login_required": "login_required",
        "disk_space_required": "disk_space_required",
        "done": "done",
        "error": "error",
        "partial_deleted": "partial_deleted",
        "rate_limited": "rate_limited",
    },
    "liberator": {"state_changed": "state", "tree_changed": "tree", "error": "error"},
    "rvpn": {
        "state_changed": "state",
        "error": "error",
        "progress": "progress",
    },
    "launch": {"error": "error", "running_changed": "running", "launching_changed": "launching"},
    "update": {"changed": "changed", "progress": "progress", "done": "done", "error": "error"},
    "uninstall": {"done": "done", "item_done": "item_done"},
    "shears": {"scan_done": "scan", "cut_done": "cut"},
    "cheatengine": {"done": "done"},
}


def _wire_events(view: BrowserView, bridges: dict[str, QObject]) -> None:
    for target, signals in FORWARDS.items():
        obj = bridges.get(target)
        if obj is None:
            continue
        forwarder = EventForwarder(view, target)
        for signal, event in signals.items():
            getattr(obj, signal).connect(lambda *args, f=forwarder, e=event: f.send(e, *args))
        if target == "downloader":
            obj.log_line.connect(lambda s, f=forwarder: f.send_buffered("log_line", s))
            obj.progress_changed.connect(
                lambda *_, f=forwarder, o=obj: f.send_buffered(
                    "progress", o.property("progress"), o.property("step"), o.property("steps")
                )
            )
            for prop in ("state", "running", "active_key", "active_hm", "verifying"):
                getattr(obj, f"{prop}_changed").connect(
                    lambda *_, f=forwarder, o=obj, p=prop: f.send(p, o.property(p))
                )
            obj.queue_changed.connect(
                lambda *_, f=forwarder, o=obj: f.send("queue", o.queued_items()))


def main() -> int:
    log.install_excepthook()
    if sys.platform == "linux":
        os.environ.setdefault("QT_QPA_PLATFORMTHEME", "xdgdesktopportal")
        if FROZEN and "SSL_CERT_FILE" not in os.environ:
            bundle = next((p for p in CA_BUNDLES if Path(p).exists()), None)
            if bundle is not None:
                os.environ["SSL_CERT_FILE"] = bundle
    os.environ.setdefault(
        "QTWEBENGINE_CHROMIUM_FLAGS",
        "--disable-accelerated-video-decode --disable-gpu-memory-buffer-video-frames"
        " --enable-features=OverlayScrollbar,FluentOverlayScrollbar",
    )
    app = QApplication(sys.argv)
    app.setApplicationName("Launcher")
    app.setApplicationDisplayName("Throwback Launcher")
    app.setDesktopFileName(DIR_NAME)
    app.setWindowIcon(QIcon(str(ICON_FILE)))

    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    lock = QLockFile(str(DATA_ROOT / ".lock"))
    lock.setStaleLockTime(0)
    if not lock.tryLock(10_000 if "--relaunch" in sys.argv else 0):
        peer = QLocalSocket()
        peer.connectToServer(INSTANCE_KEY)
        peer.waitForConnected(300)
        peer.close()
        return 0

    with contextlib.suppress(OSError):
        DEFAULT_DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    settings = load_settings()
    try:
        downloads = load_downloads()
    except RuntimeError as e:
        QMessageBox.critical(None, "Throwback Launcher", str(e))
        return 1
    threading.Thread(target=is_discord_installed, daemon=True).start()
    threading.Thread(target=prune_prefixes, daemon=True).start()

    downloader = DownloadController(settings, downloads)
    app.aboutToQuit.connect(downloader.shutdown)

    updater = UpdateController()
    settings_bridge = Settings(settings, downloader, updater)
    updater.set_peers(settings_bridge, downloader)

    watchdog = Watchdog()
    liberator = LiberatorController(settings, watchdog)
    app.aboutToQuit.connect(liberator.stop)

    rpc = RpcController(downloads, watchdog)
    app.aboutToQuit.connect(rpc.stop)

    rvpn = RvpnController() if sys.platform == "linux" else None
    if rvpn is not None:
        app.aboutToQuit.connect(rvpn.shutdown)
        if get_setting(settings, "rvpn_autostart", False) and rvpn_core.is_installed():
            rvpn.start()

    uninstaller = UninstallController(downloader)
    launch = LaunchController(settings, downloads, watchdog)
    downloader.set_peers(updater, settings_bridge, uninstaller, launch)
    shears = Shears(downloader)

    server = StaticServer(NEXT_OUT_DIR)
    server.start()
    app.aboutToQuit.connect(server.stop)

    library = Library(downloads)
    has_local = bool(library.home())
    bridges: dict[str, QObject] = {
        "library": library,
        "info": Info(),
        "settings": settings_bridge,
        "downloader": downloader,
        "liberator": liberator,
        "launch": launch,
        "shears": shears,
        "uninstall": uninstaller,
        "update": updater,
    }
    if rvpn is not None:
        bridges["rvpn"] = rvpn
    if sys.platform == "linux":
        bridges["cheatengine"] = CheatEngine(settings, downloads)
    view = BrowserView(
        server.base_url + ("/" if has_local else "/download/"), bridges, has_local
    )
    view.setWindowTitle("Throwback Launcher")
    avail = app.primaryScreen().availableSize()
    width = max(940, min(1280, round(avail.width() * 0.9)))
    height = max(540, min(720, round(avail.height() * 0.9)))
    view.setMinimumSize(380, 500)
    view.resize(width, height)
    view.show()

    def activate_window() -> None:
        while (conn := instance_server.nextPendingConnection()) is not None:
            conn.close()
            conn.deleteLater()
        view.showNormal()
        view.raise_()
        view.activateWindow()

    QLocalServer.removeServer(INSTANCE_KEY)
    instance_server = QLocalServer()
    instance_server.newConnection.connect(activate_window)
    instance_server.listen(INSTANCE_KEY)
    app.aboutToQuit.connect(instance_server.close)

    _wire_events(view, bridges)
    watchdog.start()

    if get_setting(settings, "liberator_enabled", True):
        liberator.start()
    settings_bridge.liberator_enabled_changed.connect(
        lambda: liberator.start() if settings_bridge.liberator_enabled else liberator.stop()
    )

    rpc.set_enabled(get_setting(settings, "discord_rpc", True))
    settings_bridge.discord_rpc_changed.connect(
        lambda: rpc.set_enabled(settings_bridge.discord_rpc)
    )

    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
