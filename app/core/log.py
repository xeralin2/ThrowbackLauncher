import sys
import threading
import traceback
from datetime import datetime

from core.constants import LOG_FILE, VERSION

_lock = threading.Lock()


def record(line: str) -> None:
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with _lock:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        header = None if LOG_FILE.exists() else f"[{stamp}] v{VERSION}"
        with LOG_FILE.open("a", encoding="utf-8") as file:
            if header is not None:
                file.write(header + "\n")
            file.write(f"[{stamp}] {line}\n")


def fail(message: str, detail: object) -> str:
    record(f"ERROR {message} - {detail}")
    return message


def _trace(exc_type, exc, tb) -> str:
    return "".join(traceback.format_exception(exc_type, exc, tb)).rstrip()


def install_excepthook() -> None:
    prev = sys.excepthook

    def hook(exc_type, exc, tb):
        record("CRASH\n" + _trace(exc_type, exc, tb))
        prev(exc_type, exc, tb)

    sys.excepthook = hook

    prev_thread = threading.excepthook

    def thread_hook(args):
        record("THREAD CRASH\n" + _trace(
            args.exc_type, args.exc_value, args.exc_traceback
        ))
        prev_thread(args)

    threading.excepthook = thread_hook
