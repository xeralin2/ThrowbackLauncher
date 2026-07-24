import contextlib
import os
import sys
import tempfile
from pathlib import Path

from core.constants import FROZEN, IS_WINDOWS
from core.winspawn import spawn_detached
from layout import APP_NAME, APP_SUBDIR, UNINSTALL_KEY


def run() -> None:
    if not IS_WINDOWS or not FROZEN:
        return
    import winreg

    exe_dir = Path(sys.executable).resolve().parent
    if exe_dir.name != APP_SUBDIR:
        return
    install_dir = exe_dir.parent

    shortcut = (
        Path(os.environ.get("APPDATA", ""))
        / "Microsoft" / "Windows" / "Start Menu" / "Programs" / f"{APP_NAME}.lnk"
    )
    with contextlib.suppress(OSError):
        shortcut.unlink(missing_ok=True)
    with contextlib.suppress(OSError):
        winreg.DeleteKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY)

    bat = Path(tempfile.gettempdir()) / "ThrowbackLauncher.uninstall.bat"
    prefix = str(install_dir).replace("'", "''") + "\\"
    kill = (
        "powershell -NoProfile -NonInteractive -Command "
        f"\"Get-Process | Where-Object {{ $_.Path -and $_.Path.StartsWith('{prefix}',"
        " [System.StringComparison]::OrdinalIgnoreCase) } | Stop-Process -Force\""
    )
    script = (
        "@echo off\r\n"
        "chcp 65001>nul\r\n"
        "ping 127.0.0.1 -n 3 >nul\r\n"
        f"{kill} >nul 2>&1\r\n"
        "ping 127.0.0.1 -n 2 >nul\r\n"
        f'rmdir /s /q "{install_dir}" >nul 2>&1\r\n'
        'del "%~f0"\r\n'
    )
    with contextlib.suppress(OSError):
        bat.write_text(script, encoding="utf-8")
        spawn_detached(["cmd", "/d", "/c", str(bat)])
