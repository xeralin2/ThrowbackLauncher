import contextlib
import ctypes
import functools
import os
import shutil
import sys
import time
from pathlib import Path

from core.constants import DATA_ROOT, FROZEN, INSTANCE_KEY, IS_WINDOWS, VERSION, version_tuple
from core.winspawn import spawn_detached
from layout import APP_SUBDIR, PENDING_FILE, PENDING_SUBDIR, PREVIOUS_SUBDIR

OUTCOME = ".update-outcome"
ATTEMPTED = ".attempted"
_MUTEX_NAME = f"Local\\{INSTANCE_KEY}.update"
_SYNCHRONIZE = 0x00100000
_WAIT_OBJECT_0 = 0
_ERROR_ALREADY_EXISTS = 183
_mutex = None


@functools.cache
def _kernel32() -> ctypes.CDLL:
    return ctypes.WinDLL("kernel32", use_last_error=True)


def _claim() -> bool:
    global _mutex
    if _mutex is not None:
        return True
    kernel32 = _kernel32()
    handle = kernel32.CreateMutexW(None, True, _MUTEX_NAME)
    if not handle:
        return False
    if ctypes.get_last_error() == _ERROR_ALREADY_EXISTS:
        kernel32.CloseHandle(handle)
        return False
    _mutex = handle
    return True


def _helper_running() -> bool:
    kernel32 = _kernel32()
    handle = kernel32.CreateMutexW(None, True, _MUTEX_NAME)
    if not handle:
        return True
    held = ctypes.get_last_error() == _ERROR_ALREADY_EXISTS
    kernel32.CloseHandle(handle)
    return held


def _paths() -> tuple[Path, Path, Path]:
    return DATA_ROOT / APP_SUBDIR, DATA_ROOT / PENDING_SUBDIR, DATA_ROOT / PREVIOUS_SUBDIR


def pending_dir() -> Path:
    return _paths()[1]


def _wait_pid(pid: int, timeout_ms: int = 30_000) -> bool:
    kernel32 = _kernel32()
    handle = kernel32.OpenProcess(_SYNCHRONIZE, False, pid)
    if not handle:
        return True
    result = kernel32.WaitForSingleObject(handle, timeout_ms)
    kernel32.CloseHandle(handle)
    return result == _WAIT_OBJECT_0


def _move(src: Path, dst: Path, deadline: float) -> bool:
    while True:
        try:
            os.rename(src, dst)
            return True
        except OSError:
            if dst.exists() and not src.exists():
                return True
            if time.monotonic() > deadline:
                return False
            time.sleep(0.25)


def _remove(path: Path) -> None:
    with contextlib.suppress(OSError):
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
        else:
            path.unlink(missing_ok=True)


def _clear(path: Path, deadline: float) -> bool:
    while True:
        _remove(path)
        if not path.exists():
            return True
        if time.monotonic() > deadline:
            return False
        time.sleep(0.25)


def _pending_ok(pending: Path) -> bool:
    marker = pending / PENDING_FILE
    if not pending.is_dir() or not marker.is_file():
        return False
    try:
        version = marker.read_text(encoding="ascii").strip()
        return version_tuple(version) >= version_tuple(VERSION)
    except (OSError, ValueError):
        return False


def _outcome(ok: bool) -> None:
    with contextlib.suppress(OSError):
        (DATA_ROOT / OUTCOME).write_text("ok" if ok else "", encoding="ascii")


def helper_argv(target: Path) -> list[str]:
    exe = target / Path(sys.executable).name
    return [str(exe), "--relaunch", str(os.getpid())]


def maybe_apply_pending() -> bool:
    if not (IS_WINDOWS and FROZEN):
        return False
    app, pending, previous = _paths()
    if Path(sys.executable).resolve().parent != app:
        return False
    _clear(previous, time.monotonic() + 5)
    if not _pending_ok(pending) or not (pending / Path(sys.executable).name).is_file():
        _remove(pending)
        return False
    attempted = pending / ATTEMPTED
    if attempted.exists():
        if _helper_running():
            return True
        _remove(pending)
        _outcome(False)
        return False
    with contextlib.suppress(OSError):
        attempted.touch()
    try:
        spawn_detached(helper_argv(pending))
    except OSError:
        _remove(pending)
        return False
    return True


def take_outcome() -> bool | None:
    if not (IS_WINDOWS and FROZEN):
        return None
    marker = DATA_ROOT / OUTCOME
    try:
        outcome = marker.read_text(encoding="ascii")
    except OSError:
        return None
    with contextlib.suppress(OSError):
        marker.unlink()
    return outcome == "ok"


def _flip(app: Path, pending: Path, previous: Path) -> None:
    deadline = time.monotonic() + 60
    if not app.is_dir():
        if _pending_ok(pending):
            with contextlib.suppress(OSError):
                spawn_detached(helper_argv(previous))
            return
        if _move(previous, app, deadline):
            _outcome(False)
            with contextlib.suppress(OSError):
                spawn_detached([str(app / Path(sys.executable).name)])
        return
    if _pending_ok(pending) and _clear(previous, deadline) and _move(app, previous, deadline):
        try:
            spawn_detached(helper_argv(previous))
            return
        except OSError:
            if not _move(previous, app, time.monotonic() + 15):
                return
    with contextlib.suppress(OSError):
        (pending / PENDING_FILE).unlink(missing_ok=True)
    _outcome(False)
    with contextlib.suppress(OSError):
        spawn_detached([str(app / Path(sys.executable).name)])


def _finish(app: Path, pending: Path) -> None:
    if not _move(pending, app, time.monotonic() + 60):
        with contextlib.suppress(OSError):
            (pending / PENDING_FILE).unlink(missing_ok=True)
        _outcome(False)
        with contextlib.suppress(OSError):
            spawn_detached(helper_argv(pending))
        return
    for name in (PENDING_FILE, ATTEMPTED):
        with contextlib.suppress(OSError):
            (app / name).unlink(missing_ok=True)
    _outcome(True)
    with contextlib.suppress(OSError):
        spawn_detached([str(app / Path(sys.executable).name)])


def run_relaunch(argv: list[str]) -> int:
    if not (IS_WINDOWS and FROZEN):
        return 0
    app, pending, previous = _paths()
    here = Path(sys.executable).resolve().parent
    relaunch = [str(app / Path(sys.executable).name)]
    with contextlib.suppress(ValueError, IndexError):
        pid = int(argv[argv.index("--relaunch") + 1])
        if not _wait_pid(pid):
            with contextlib.suppress(OSError):
                spawn_detached(relaunch)
            return 0
    if not _claim():
        return 0
    if here == pending:
        _flip(app, pending, previous)
    elif here == previous:
        _finish(app, pending)
    else:
        with contextlib.suppress(OSError):
            spawn_detached(relaunch)
    return 0
