from PySide6.QtCore import QObject, QStandardPaths, Qt, QUrl
from PySide6.QtGui import QDesktopServices
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtWebEngineCore import QWebEnginePage, QWebEngineScript, QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView

from core.constants import IS_WINDOWS


def _platform_script(has_local: bool) -> QWebEngineScript:
    script = QWebEngineScript()
    script.setName("throwback-platform")
    script.setInjectionPoint(QWebEngineScript.InjectionPoint.DocumentCreation)
    script.setWorldId(QWebEngineScript.ScriptWorldId.MainWorld)
    script.setRunsOnSubFrames(False)
    script.setSourceCode(
        f'window.__throwbackOS = "{"windows" if IS_WINDOWS else "linux"}";'
        f"window.__throwbackHasLocal = {'true' if has_local else 'false'};"
    )
    return script


def _is_internal(url: QUrl, origin: QUrl) -> bool:
    return (url.scheme(), url.host(), url.port()) == (
        origin.scheme(), origin.host(), origin.port()
    )


class _AppPage(QWebEnginePage):
    def __init__(self, origin: QUrl, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._origin = origin

    def acceptNavigationRequest(
        self, url: QUrl, nav_type: QWebEnginePage.NavigationType, is_main_frame: bool
    ) -> bool:
        if (
            nav_type == QWebEnginePage.NavigationType.NavigationTypeLinkClicked
            and url.scheme() in ("http", "https")
            and not _is_internal(url, self._origin)
        ):
            QDesktopServices.openUrl(url)
            return False
        return super().acceptNavigationRequest(url, nav_type, is_main_frame)


class BrowserView(QWebEngineView):
    def __init__(self, url: str, objects: dict[str, QObject], has_local: bool) -> None:
        super().__init__()

        self.setContextMenuPolicy(Qt.ContextMenuPolicy.NoContextMenu)
        self._origin = QUrl(url)
        self.setPage(_AppPage(self._origin, self))

        self.page().settings().setAttribute(
            QWebEngineSettings.WebAttribute.ScrollAnimatorEnabled, True
        )
        self.page().settings().setAttribute(
            QWebEngineSettings.WebAttribute.JavascriptCanAccessClipboard, True
        )
        self.page().scripts().insert(_platform_script(has_local))
        self.page().newWindowRequested.connect(self._open_external_window)
        self.page().profile().downloadRequested.connect(self._accept_download)

        self._channel = QWebChannel(self.page())
        for name, obj in objects.items():
            obj.setParent(self)
            self._channel.registerObject(name, obj)
        self.page().setWebChannel(self._channel)

        self.load(self._origin)

    def _open_external_window(self, request) -> None:
        url = request.requestedUrl()
        if url.scheme() in ("http", "https") and not _is_internal(url, self._origin):
            QDesktopServices.openUrl(url)

    def _accept_download(self, request) -> None:
        request.setDownloadDirectory(
            QStandardPaths.writableLocation(QStandardPaths.StandardLocation.DownloadLocation)
        )
        request.accept()
