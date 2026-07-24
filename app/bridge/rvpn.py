import threading
from pathlib import Path

from PySide6.QtCore import QObject, Signal, Slot

from core import log
from bridge.dialogs import pick_file
from bridge.reporter import SignalReporter
from core.depot import Cancelled, RateLimited
from core.rvpn import (
    Session,
    ensure_wine,
    is_installed,
    is_radmin_installer,
    service_version,
    uninstall,
)


class RvpnController(QObject):
    state_changed = Signal("QVariantMap")
    error = Signal(str)
    progress = Signal(float)
    _state_in = Signal("QVariantMap")
    _progress_in = Signal(float)

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._session: Session | None = None
        self._thread: threading.Thread | None = None
        self._installer = ""
        self._busy = False
        self._cancel = threading.Event()
        self._progress = 0.0
        self._state = self._make_state("idle")
        self._state_in.connect(self._store_and_emit)
        self._progress_in.connect(self._store_progress)

    def _make_state(self, status: str) -> dict:
        return {
            "status": status,
            "installed": is_installed(),
            "hasInstaller": bool(self._installer),
            "busy": self._busy,
            "progress": self._progress,
            "version": service_version(),
        }

    def _store_progress(self, fraction: float) -> None:
        self._progress = fraction * 100
        self._state["progress"] = self._progress
        self.progress.emit(self._progress)

    def _store_and_emit(self, state: dict) -> None:
        self._state = state
        self.state_changed.emit(state)

    def busy(self) -> bool:
        return self._busy

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return self._state

    @Slot()
    def select_installer(self) -> None:
        picked = pick_file("Choose the Radmin VPN installer", ".exe installer (*.exe)")
        if not picked:
            return
        if not is_radmin_installer(picked):
            self.error.emit(log.fail("This is not a Radmin VPN installer", picked))
            return
        self._installer = picked
        self.start()

    @Slot()
    def start(self) -> None:
        if self._busy:
            return
        self._cancel.clear()
        self._busy = True
        self._progress = 0.0
        self._store_and_emit(self._make_state("building"))
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    @Slot()
    def stop(self) -> None:
        self._cancel.set()
        session = self._session
        if session is not None:
            session.stop()

    def shutdown(self) -> None:
        self.stop()
        thread = self._thread
        if thread is not None:
            thread.join(timeout=10)

    @Slot()
    def uninstall(self) -> None:
        if self._busy:
            return
        self._busy = True
        self._store_and_emit(self._make_state("idle"))
        self._thread = threading.Thread(target=self._uninstall, daemon=True)
        self._thread.start()

    def _uninstall(self) -> None:
        try:
            uninstall()
        except OSError as error:
            self.error.emit(str(error))
        finally:
            self._busy = False
            self._state_in.emit(self._make_state("idle"))

    def _run(self) -> None:
        reporter = SignalReporter(progress_emit=self._progress_in.emit,
                                  fail_emit=self._emit_error)
        try:
            ensure_wine(reporter, self._cancel.is_set)
            if self._cancel.is_set():
                return
            self._session = Session()
            if self._cancel.is_set():
                return
            installer = Path(self._installer) if self._installer else None
            self._session.run(installer, reporter, on_running=self._on_running)
        except Cancelled:
            pass
        except RateLimited as e:
            self._emit_error(e.message())
        except Exception as e:
            self._emit_error(str(e))
        finally:
            self._session = None
            self._busy = False
            self._state_in.emit(self._make_state("idle"))

    def _emit_error(self, text: str) -> None:
        if not self._cancel.is_set():
            self.error.emit(text)

    def _on_running(self) -> None:
        self._state_in.emit(self._make_state("running"))
