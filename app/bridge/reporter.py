from collections.abc import Callable


class SignalReporter:
    def __init__(self, emit: Callable[[str], None] | None = None,
                 progress_emit: Callable[[float], None] | None = None,
                 fail_emit: Callable[[str], None] | None = None) -> None:
        self._emit = emit
        self._progress_emit = progress_emit
        self._fail_emit = fail_emit

    def update(self, text: str) -> None:
        if self._emit is not None:
            self._emit(text)

    def succeed(self, text: str) -> None:
        if self._emit is not None:
            self._emit(text)

    def fail(self, text: str) -> None:
        if self._emit is not None:
            self._emit(text)
        if self._fail_emit is not None:
            self._fail_emit(text)

    def progress(self, fraction: float) -> None:
        if self._progress_emit is not None:
            self._progress_emit(fraction)
