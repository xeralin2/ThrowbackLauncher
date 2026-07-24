import contextlib
import os
import shutil
import ssl
import subprocess
import sys
import tempfile
import threading
import urllib.request
import zipfile
from pathlib import Path

import truststore
from PySide6.QtCore import Qt, QLockFile, QRectF, QSize, QThread, Signal
from PySide6.QtGui import (
    QBrush,
    QColor,
    QFont,
    QFontDatabase,
    QGradient,
    QIcon,
    QLinearGradient,
    QPainter,
    QPainterPath,
    QPen,
    QPixmap,
)
from PySide6.QtWidgets import (
    QApplication,
    QFileDialog,
    QFrame,
    QGraphicsOpacityEffect,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QSizePolicy,
    QVBoxLayout,
    QWidget,
)

from layout import (
    APP_NAME,
    APP_SUBDIR,
    DIR_NAME,
    PENDING_FILE,
    PENDING_SUBDIR,
    PREVIOUS_SUBDIR,
    PUBLISHER,
    UNINSTALL_KEY,
)

PAYLOAD_URL = "https://github.com/xeralin2/ThrowbackLauncher/releases/latest/download/App.zip"
SSL_CONTEXT = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)

_LOCAL = os.environ.get("LOCALAPPDATA") or str(Path.home() / "AppData" / "Local")
DEFAULT_DIR = Path(_LOCAL) / DIR_NAME
EXE_NAME = "Launcher.exe"


def app_exe(root: Path) -> Path:
    return root / APP_SUBDIR / EXE_NAME


def _load_fonts() -> None:
    fonts = Path(__file__).resolve().parent / "assets" / "fonts"
    for ttf in fonts.glob("*.ttf"):
        QFontDatabase.addApplicationFont(str(ttf))


STYLE = """
#card {
    background: #13131a;
    border: 1px solid #2a2a38;
    border-radius: 8px;
    font-family: "Barlow";
}
#title { color: #e8e0d5; font-family: "Rajdhani"; font-weight: 700; font-size: 18px; }
#body { color: #7a7890; font-size: 12px; }
#status {
    background: #1a1a24;
    border: 1px solid #2a2a38;
    border-radius: 4px;
    padding: 2px 6px;
    color: #e8e0d5;
    font-family: "Share Tech Mono";
    font-size: 12px;
}
#path {
    background: #1a1a24;
    border: 1px solid #2a2a38;
    border-radius: 4px;
}
#pathtext {
    background: transparent;
    border: none;
    color: #e8e0d5;
    font-family: "Share Tech Mono";
    font-size: 12px;
}
#browse { background: transparent; border: none; padding: 1px; }
#close {
    background: #1a1a24;
    border: 1px solid #2a2a38;
    border-radius: 6px;
    color: #7a7890;
}
#close:hover { background: #2a2a38; color: #e8e0d5; }
"""


def _fade_right(widget: QWidget) -> None:
    gradient = QLinearGradient(0, 0, 1, 0)
    gradient.setCoordinateMode(QGradient.CoordinateMode.ObjectBoundingMode)
    gradient.setColorAt(0.9, Qt.GlobalColor.black)
    gradient.setColorAt(1.0, Qt.GlobalColor.transparent)
    effect = QGraphicsOpacityEffect(widget)
    effect.setOpacityMask(QBrush(gradient))
    widget.setGraphicsEffect(effect)


def _button_font() -> QFont:
    font = QFont()
    font.setFamilies(["Share Tech Mono", "monospace"])
    font.setPixelSize(12)
    font.setLetterSpacing(QFont.SpacingType.AbsoluteSpacing, 1.0)
    return font


def _draw_icon(paint) -> QIcon:
    pixmap = QPixmap(48, 48)
    pixmap.fill(Qt.GlobalColor.transparent)
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing)
    paint(painter, 48 / 24)
    painter.end()
    return QIcon(pixmap)


def _folder_icon(color: str) -> QIcon:
    def paint(painter, k):
        pen = QPen(QColor(color))
        pen.setWidthF(2 * k)
        pen.setCapStyle(Qt.PenCapStyle.RoundCap)
        pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin)
        painter.setPen(pen)
        painter.setBrush(Qt.BrushStyle.NoBrush)
        path = QPainterPath()
        path.moveTo(4 * k, 20 * k)
        path.lineTo(20 * k, 20 * k)
        path.quadTo(22 * k, 20 * k, 22 * k, 18 * k)
        path.lineTo(22 * k, 8 * k)
        path.quadTo(22 * k, 6 * k, 20 * k, 6 * k)
        path.lineTo(12.1 * k, 6 * k)
        path.quadTo(11 * k, 6 * k, 10.41 * k, 5.1 * k)
        path.lineTo(9.6 * k, 3.9 * k)
        path.quadTo(9 * k, 3 * k, 7.93 * k, 3 * k)
        path.lineTo(4 * k, 3 * k)
        path.quadTo(2 * k, 3 * k, 2 * k, 5 * k)
        path.lineTo(2 * k, 18 * k)
        path.quadTo(2 * k, 20 * k, 4 * k, 20 * k)
        path.closeSubpath()
        painter.drawPath(path)

    return _draw_icon(paint)


def _target_dir(chosen: Path) -> Path:
    return chosen if chosen.name == DIR_NAME else chosen / DIR_NAME


def _installed_dir() -> Path | None:
    import winreg

    with (contextlib.suppress(OSError),
          winreg.OpenKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY) as k):
        value, _ = winreg.QueryValueEx(k, "InstallLocation")
        if value and Path(value).is_dir():
            return Path(value)
    return None


def _finish_update(root: Path) -> None:
    app = root / APP_SUBDIR
    pending = root / PENDING_SUBDIR
    if app.exists() or not (pending / PENDING_FILE).is_file():
        return
    with contextlib.suppress(OSError):
        pending.rename(app)
        (app / PENDING_FILE).unlink(missing_ok=True)


def _launch_app(root: Path) -> None:
    subprocess.Popen([str(app_exe(root))], cwd=str(root))


def _create_shortcut(root: Path) -> None:
    appdata = os.environ.get("APPDATA")
    if not appdata:
        return
    programs = Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs"
    lnk = programs / f"{APP_NAME}.lnk"
    lnk_ps = str(lnk).replace("'", "''")
    exe_ps = str(app_exe(root)).replace("'", "''")
    dir_ps = str(root).replace("'", "''")
    ps = (
        f"$s=(New-Object -COM WScript.Shell).CreateShortcut('{lnk_ps}');"
        f"$s.TargetPath='{exe_ps}';"
        f"$s.WorkingDirectory='{dir_ps}';"
        f"$s.IconLocation='{exe_ps}';"
        f"$s.Save()"
    )
    subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
        creationflags=subprocess.CREATE_NO_WINDOW,
        check=False,
    )


def _register_uninstall(root: Path) -> None:
    import winreg

    exe = app_exe(root)
    with (contextlib.suppress(OSError),
          winreg.CreateKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY) as k):
        winreg.SetValueEx(k, "DisplayName", 0, winreg.REG_SZ, APP_NAME)
        winreg.SetValueEx(k, "DisplayIcon", 0, winreg.REG_SZ, str(exe))
        winreg.SetValueEx(k, "Publisher", 0, winreg.REG_SZ, PUBLISHER)
        winreg.SetValueEx(k, "InstallLocation", 0, winreg.REG_SZ, str(root))
        winreg.SetValueEx(k, "UninstallString", 0, winreg.REG_SZ, f'"{exe}" --uninstall')
        winreg.SetValueEx(k, "NoModify", 0, winreg.REG_DWORD, 1)
        winreg.SetValueEx(k, "NoRepair", 0, winreg.REG_DWORD, 1)


class _Cancelled(Exception):
    pass


class Installer(QThread):
    progress = Signal(int)
    status = Signal(str)
    ready = Signal()
    failed = Signal(str)
    done = Signal(str)
    aborted = Signal()

    def __init__(self, root: Path) -> None:
        super().__init__()
        self._cancel = False
        self._confirmed = threading.Event()
        self.root = root

    def confirm(self, root: Path) -> None:
        self.root = root
        self._confirmed.set()

    def cancel(self) -> None:
        self._cancel = True
        self._confirmed.set()

    def _check(self) -> None:
        if self._cancel:
            raise _Cancelled

    def run(self) -> None:
        archive = Path(tempfile.gettempdir()) / "ThrowbackLauncher.zip"
        try:
            self._download(PAYLOAD_URL, archive)
            if not self._confirmed.is_set():
                self.status.emit("Ready")
                self.ready.emit()
                self._confirmed.wait()
            self._check()
            root = self.root
            self._extract(archive, root)
            with contextlib.suppress(OSError):
                archive.unlink()
            _create_shortcut(root)
            _register_uninstall(root)
            self.done.emit(str(root))
        except _Cancelled:
            self._cleanup(archive, self.root)
            self.aborted.emit()
        except Exception as e:
            self._cleanup(archive, self.root)
            if self._cancel:
                self.aborted.emit()
            else:
                self.failed.emit(f"{type(e).__name__}: {e}"[:160])

    def _cleanup(self, archive: Path, root: Path) -> None:
        with contextlib.suppress(OSError):
            archive.unlink()
        shutil.rmtree(root / PENDING_SUBDIR, ignore_errors=True)
        with contextlib.suppress(OSError):
            root.rmdir()

    def _download(self, url: str, dest: Path) -> None:
        req = urllib.request.Request(url, headers={"User-Agent": APP_NAME})
        with (urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as r,
              open(dest, "wb") as f):
            total = int(r.headers.get("Content-Length") or 0)
            read = 0
            last = -1
            last_pct = -1
            while True:
                self._check()
                chunk = r.read(1 << 16)
                if not chunk:
                    break
                f.write(chunk)
                read += len(chunk)
                pct = int(read * 90 / total) if total else 0
                if pct != last_pct:
                    last_pct = pct
                    self.progress.emit(pct)
                if read // 100_000 != last:
                    last = read // 100_000
                    self.status.emit(f"Downloading {read / 1_000_000:.1f} MB")

    def _extract(self, archive: Path, root: Path) -> None:
        app = root / APP_SUBDIR
        pending = root / PENDING_SUBDIR
        previous = root / PREVIOUS_SUBDIR
        shutil.rmtree(pending, ignore_errors=True)
        pending.mkdir(parents=True)
        with zipfile.ZipFile(archive) as z:
            members = z.infolist()
            last_pct = -1
            for i, member in enumerate(members):
                self._check()
                z.extract(member, pending)
                pct = 90 + int((i + 1) * 10 / len(members))
                if pct != last_pct:
                    last_pct = pct
                    self.progress.emit(pct)
                name = member.filename.rstrip("/").rsplit("/", 1)[-1]
                if name:
                    self.status.emit(name)
            missing = [m for m in members if not (pending / m.filename).exists()]
            if missing:
                raise OSError(f"{len(missing)} files are missing after extraction")
        self._check()
        if app.exists():
            shutil.rmtree(previous, ignore_errors=True)
            app.rename(previous)
        pending.rename(app)
        shutil.rmtree(previous, ignore_errors=True)


class IconButton(QPushButton):
    def __init__(self, normal: QIcon, hover: QIcon) -> None:
        super().__init__()
        self._normal = normal
        self._hover = hover
        self.setIcon(normal)

    def enterEvent(self, event) -> None:
        if self.isEnabled():
            self.setIcon(self._hover)

    def leaveEvent(self, event) -> None:
        self.setIcon(self._normal)


class ProgressButton(QPushButton):
    def __init__(self, text: str) -> None:
        super().__init__(text)
        self._progress = 0
        self._hover = False
        self._active = False
        self.setFocusPolicy(Qt.FocusPolicy.NoFocus)
        self.setCursor(Qt.CursorShape.ForbiddenCursor)

    def set_progress(self, value: int) -> None:
        self._progress = value
        self.update()

    def set_active(self, active: bool) -> None:
        self._active = active
        self._hover = False
        self.setCursor(
            Qt.CursorShape.PointingHandCursor if active else Qt.CursorShape.ForbiddenCursor
        )
        self.update()

    def set_failed(self) -> None:
        self._progress = 0
        self.set_active(False)

    def mousePressEvent(self, event) -> None:
        if self._active:
            super().mousePressEvent(event)

    def enterEvent(self, event) -> None:
        self._hover = True
        self.update()

    def leaveEvent(self, event) -> None:
        self._hover = False
        self.update()

    def paintEvent(self, event) -> None:
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        rect = QRectF(self.rect())
        path = QPainterPath()
        path.addRoundedRect(rect, 6, 6)
        if self._active:
            painter.fillPath(path, QColor("#a01020" if self._hover else "#c0152a"))
        else:
            painter.fillPath(path, QColor("#581420"))
            width = rect.width() * self._progress / 100
            if width > 0:
                painter.setClipRect(QRectF(0, 0, width, rect.height()))
                painter.fillPath(path, QColor("#c0152a"))
                painter.setClipping(False)
        painter.setPen(QColor("white"))
        painter.setFont(self.font())
        painter.drawText(rect, Qt.AlignmentFlag.AlignCenter, self.text())


class InstallerWindow(QWidget):
    def __init__(self, root: Path) -> None:
        super().__init__()
        self._root = root
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setStyleSheet(STYLE)
        self.setFixedWidth(480)
        self._drag = None

        card = QFrame()
        card.setObjectName("card")
        card.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        shell = QVBoxLayout(self)
        shell.setContentsMargins(0, 0, 0, 0)
        shell.addWidget(card)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(11)

        title = QLabel(f"Install {APP_NAME}")
        title.setObjectName("title")
        body = QLabel(
            "Pick where to install the Launcher. You can add library folders later."
        )
        body.setObjectName("body")
        body.setWordWrap(True)

        path_box = QFrame()
        path_box.setObjectName("path")
        path_box.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        path_box.setFixedHeight(25)
        self._path_text = QLabel(str(root))
        self._path_text.setObjectName("pathtext")
        self._path_text.setSizePolicy(QSizePolicy.Policy.Ignored, QSizePolicy.Policy.Preferred)
        self._path_text.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        _fade_right(self._path_text)
        self._browse = IconButton(_folder_icon("#7a7890"), _folder_icon("#e8e0d5"))
        self._browse.setObjectName("browse")
        self._browse.setIconSize(QSize(15, 15))
        self._browse.setFixedSize(QSize(19, 19))
        self._browse.setToolTip("Change folder")
        self._browse.setCursor(Qt.CursorShape.PointingHandCursor)
        self._browse.clicked.connect(self._choose_folder)
        path_row = QHBoxLayout(path_box)
        path_row.setContentsMargins(10, 0, 5, 0)
        path_row.setSpacing(6)
        path_row.addWidget(self._path_text, 1)
        path_row.addWidget(self._browse)

        self._status = QLabel("Downloading")
        self._status.setObjectName("status")

        self._cont = ProgressButton("Install")
        self._cont.clicked.connect(self._on_primary)
        self._cont.setFont(_button_font())
        self._cont.setFixedHeight(30)
        self._cont.setMinimumWidth(104)
        self._close = QPushButton("Cancel")
        self._close.setObjectName("close")
        self._close.setFont(_button_font())
        self._close.setFixedHeight(30)
        self._close.setMinimumWidth(84)
        self._close.setCursor(Qt.CursorShape.PointingHandCursor)
        self._close.clicked.connect(self._on_cancel)
        button_row = QHBoxLayout()
        button_row.setSpacing(8)
        button_row.addWidget(self._status, 0, Qt.AlignmentFlag.AlignVCenter)
        button_row.addStretch(1)
        button_row.addWidget(self._close)
        button_row.addWidget(self._cont)

        header = QVBoxLayout()
        header.setSpacing(6)
        header.addWidget(title)
        header.addWidget(body)
        layout.addLayout(header)
        layout.addWidget(path_box)
        layout.addLayout(button_row)

        self._installed = False
        self._installer = Installer(root)
        self._installer.progress.connect(self._cont.set_progress)
        self._installer.status.connect(self._status.setText)
        self._installer.ready.connect(lambda: self._cont.set_active(True))
        self._installer.failed.connect(self._on_failed)
        self._installer.done.connect(self._on_done)
        self._installer.aborted.connect(QApplication.quit)

    def _center(self) -> None:
        geo = QApplication.primaryScreen().availableGeometry()
        self.move(geo.center() - self.rect().center())

    def begin(self) -> None:
        self._center()
        self._installer.start()

    def _on_cancel(self) -> None:
        if self._installer.isRunning():
            self._close.setEnabled(False)
            self._status.setText("Cancelling")
            self._installer.cancel()
        else:
            QApplication.quit()

    def _on_failed(self, reason: str) -> None:
        self._cont.set_failed()
        self._status.setText(f"Install failed - {reason}" if reason else "Install failed")
        self._close.setEnabled(True)
        self._close.setText("Close")

    def _on_primary(self) -> None:
        if self._installed:
            _launch_app(self._root)
            QApplication.quit()
            return
        self._cont.set_active(False)
        self._browse.setEnabled(False)
        self._browse.setCursor(Qt.CursorShape.ArrowCursor)
        self._installer.confirm(self._root)

    def _on_done(self, root: str) -> None:
        self._root = Path(root)
        self._installed = True
        self._cont.set_progress(100)
        self._cont.setText("Launch")
        self._cont.set_active(True)
        self._close.setEnabled(True)
        self._close.setText("Close")
        self._status.setText("Done")

    def _choose_folder(self) -> None:
        picked = QFileDialog.getExistingDirectory(
            self, "Choose install folder", str(self._root.parent)
        )
        if not picked:
            return
        self._root = _target_dir(Path(picked))
        self._path_text.setText(str(self._root))

    def mousePressEvent(self, event) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            self._drag = event.globalPosition().toPoint() - self.frameGeometry().topLeft()

    def mouseMoveEvent(self, event) -> None:
        if self._drag is not None and event.buttons() & Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self._drag)

    def mouseReleaseEvent(self, event) -> None:
        self._drag = None

    def keyPressEvent(self, event) -> None:
        if event.key() == Qt.Key.Key_Escape:
            self._on_cancel()

    def closeEvent(self, event) -> None:
        if self._installer.isRunning():
            event.ignore()
            self._on_cancel()
        else:
            event.accept()


def main() -> int:
    root = _installed_dir() or DEFAULT_DIR
    _finish_update(root)
    if app_exe(root).exists():
        _launch_app(root)
        return 0
    app = QApplication(sys.argv)
    lock = QLockFile(str(Path(tempfile.gettempdir()) / "ThrowbackLauncher.lock"))
    lock.setStaleLockTime(0)
    if not lock.tryLock(0):
        return 0
    _load_fonts()
    window = InstallerWindow(root)
    window.show()
    window.begin()
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
