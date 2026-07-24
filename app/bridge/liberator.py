import contextlib
import json
import os
import socket
import subprocess
import threading
import time
from pathlib import Path

from PySide6.QtCore import QObject, Signal, Slot

from core import log
from core.constants import (
    IS_WINDOWS,
    LIBERATOR_BIN,
    LIBERATOR_PORT_FILE,
    STEAM_DIR,
)
from core.steam import proc_environ, resolve_proton, running_game_pids

def _winpath(path: Path) -> str:
    return "Z:" + str(path).replace("/", "\\")


def _running_game_env() -> dict[str, str] | None:
    for pid in running_game_pids():
        env = proc_environ(pid)
        if env.get("STEAM_COMPAT_DATA_PATH"):
            return env
    return None


class LiberatorController(QObject):
    state_changed = Signal(object)
    tree_changed = Signal(object)
    error = Signal(str)
    _kill_requested = Signal()

    def __init__(self, settings: dict, watchdog: QObject, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._settings = settings
        self._watchdog = watchdog
        self._proc: subprocess.Popen | None = None
        self._sock: socket.socket | None = None
        self._send_lock = threading.Lock()
        self._busy = False
        self._active = False
        self._attach_delay = 1.5
        self._next_attach = 0.0
        self._last_state: dict = self._default_state()
        self._last_tree: object = None
        self._kill_requested.connect(self._kill)
        watchdog.tick.connect(self._on_tick)

    def _default_state(self) -> dict:
        return {
            "attached": False,
            "applied": False,
            "status": "",
            "available": LIBERATOR_BIN.exists(),
            "capabilities": {},
        }

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return {**self._last_state, "available": LIBERATOR_BIN.exists()}

    @Slot(result="QVariant")
    def tree_snapshot(self) -> object:
        return self._last_tree

    def start(self) -> None:
        self._active = True
        self._on_running(bool(self._watchdog.folders()))

    def stop(self) -> None:
        self._active = False
        self._kill()

    @Slot(str, bool)
    def set_mod(self, mod: str, enabled: bool) -> None:
        self._send(cmd="setMod", mod=mod, enabled=enabled)

    @Slot(str)
    def set_playlist(self, playlist_id: str) -> None:
        self._send(cmd="setPlaylist", playlistId=playlist_id)

    @Slot()
    def end_round(self) -> None:
        self._send(cmd="endRound")

    @Slot()
    def end_match(self) -> None:
        self._send(cmd="endMatch")

    def _on_tick(self, folders: object) -> None:
        self._on_running(bool(folders))

    def _on_running(self, running: bool) -> None:
        if not self._active:
            return
        if running and self._sock is None and not self._busy:
            if time.monotonic() < self._next_attach:
                return
            self._busy = True
            threading.Thread(target=self._attach, daemon=True).start()
        elif not running:
            self._attach_delay = 1.5
            self._next_attach = 0.0
            if self._sock is not None:
                self._kill()

    def _attach(self) -> None:
        try:
            helper = LIBERATOR_BIN
            if not LIBERATOR_BIN.exists():
                return

            port_file = LIBERATOR_PORT_FILE
            port_file.parent.mkdir(parents=True, exist_ok=True)
            port_file.unlink(missing_ok=True)
            if IS_WINDOWS:
                self._proc = subprocess.Popen(
                    [str(helper), "--port-file", str(port_file)],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
            else:
                env_game = _running_game_env()
                if env_game is None:
                    return
                proton = resolve_proton(self._settings)
                if proton is None:
                    self.error.emit("Could not find Proton for the running game")
                    return
                env = dict(os.environ)
                env["STEAM_COMPAT_DATA_PATH"] = env_game["STEAM_COMPAT_DATA_PATH"]
                client_install = env_game.get("STEAM_COMPAT_CLIENT_INSTALL_PATH")
                env["STEAM_COMPAT_CLIENT_INSTALL_PATH"] = client_install or str(STEAM_DIR)
                self._proc = subprocess.Popen(
                    [str(proton["binary"]), "run", _winpath(helper),
                     "--port-file", _winpath(port_file)],
                    env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )

            port = self._await_port(port_file)
            if port is None:
                self.error.emit("Liberator helper did not start")
                self._kill()
                return
            sock = socket.create_connection(("127.0.0.1", port), timeout=5)
            sock.settimeout(None)
            self._sock = sock
            threading.Thread(target=self._reader, args=(sock,), daemon=True).start()
        except Exception as e:
            self.error.emit(log.fail("Attach failed", e))
            self._kill()
        finally:
            if not self._active:
                self._kill()
            if self._sock is None:
                self._next_attach = time.monotonic() + self._attach_delay
                self._attach_delay = min(self._attach_delay * 2, 30.0)
            else:
                self._attach_delay = 1.5
            self._busy = False

    def _await_port(self, port_file: Path, timeout: float = 15.0) -> int | None:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            proc = self._proc
            if proc is not None and proc.poll() is not None:
                return None
            try:
                text = port_file.read_text().strip()
                if text:
                    return int(text)
            except (OSError, ValueError):
                pass
            time.sleep(0.2)
        return None

    def _reader(self, sock: socket.socket) -> None:
        buffer = b""
        try:
            while True:
                data = sock.recv(4096)
                if not data:
                    break
                buffer += data
                while b"\n" in buffer:
                    line, buffer = buffer.split(b"\n", 1)
                    if not line.strip():
                        continue
                    try:
                        msg = json.loads(line.decode("utf-8"))
                    except ValueError:
                        continue
                    if msg.get("event") == "state":
                        del msg["event"]
                        msg["available"] = True
                        self._last_state = msg
                        self.state_changed.emit(msg)
                    elif msg.get("event") == "tree":
                        self._last_tree = msg.get("tree")
                        self.tree_changed.emit(self._last_tree)
        except OSError:
            pass
        if sock is self._sock:
            self._kill_requested.emit()

    def _send(self, **payload: object) -> None:
        sock = self._sock
        if sock is not None:
            self._raw_send(sock, payload)

    def _raw_send(self, sock: socket.socket, payload: dict) -> None:
        data = (json.dumps(payload) + "\n").encode("utf-8")
        try:
            with self._send_lock:
                sock.sendall(data)
        except OSError:
            pass

    def _kill(self) -> None:
        sock = self._sock
        self._sock = None
        if sock is not None:
            with contextlib.suppress(OSError):
                sock.close()
        proc = self._proc
        self._proc = None
        if proc is not None:
            with contextlib.suppress(OSError):
                proc.terminate()
            threading.Thread(target=proc.wait, daemon=True).start()
        self._last_state = self._default_state()
        self._last_tree = None
        self.state_changed.emit(self._last_state)
        self.tree_changed.emit(None)
