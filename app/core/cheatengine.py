import subprocess
from pathlib import Path

from core.constants import PREFIX_DIR
from core.manifest import installed_path
from core.steam import NO_PROTON, proton_env, resolve_proton
from core.throwbackloader import read_tl_tools, write_tl_tools


def _drive_c(key: str) -> Path:
    return PREFIX_DIR / key / "pfx" / "drive_c"


def _find_ce_exe(drive_c: Path) -> str | None:
    for base in ("Program Files", "Program Files (x86)"):
        root = drive_c / base
        if not root.is_dir():
            continue
        for folder in sorted(root.glob("Cheat Engine*")):
            exe = folder / "Cheat Engine.exe"
            if exe.exists():
                return "C:\\" + str(exe.relative_to(drive_c)).replace("/", "\\")
    return None


def _season_folder(key: str) -> Path:
    path = installed_path(key, False)
    if path is None:
        raise OSError("Season is not installed")
    return path


CE_MARKER = "cheat engine"


def _without_ce(tools: list[str]) -> list[str]:
    return [t for t in tools if CE_MARKER not in t.lower()]


def _register(folder: Path, exe: str) -> None:
    tools = _without_ce(read_tl_tools(folder))
    tools.append(exe)
    write_tl_tools(folder, tools)


def is_cheat_engine_present(key: str) -> bool:
    return _find_ce_exe(_drive_c(key)) is not None


def remove_cheat_engine(key: str) -> None:
    folder = _season_folder(key)
    write_tl_tools(folder, _without_ce(read_tl_tools(folder)))


def register_cheat_engine(key: str) -> None:
    folder = _season_folder(key)
    exe = _find_ce_exe(_drive_c(key))
    if exe is None:
        raise OSError("Cheat Engine is not installed for this season")
    _register(folder, exe)


def add_cheat_engine(key: str, installer: Path, settings: dict) -> None:
    folder = _season_folder(key)
    proton = resolve_proton(settings)
    if proton is None:
        raise OSError(NO_PROTON)
    env = proton_env(PREFIX_DIR / key)
    subprocess.run(
        [str(proton["binary"]), "run", str(installer)],
        env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False,
    )
    exe = _find_ce_exe(_drive_c(key))
    if exe is None:
        raise OSError("Cheat Engine was not found after the installer finished")
    _register(folder, exe)
