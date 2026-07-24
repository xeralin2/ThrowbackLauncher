import contextlib
import os
import re
import shutil
from pathlib import Path

import psutil

from core import log
from core.constants import (
    IS_WINDOWS,
    PREFIX_DIR,
    PROTON_BUILTIN,
    PROTON_DIR,
    STEAM_DIR,
    STEAM_ROOTS,
)
from core.manifest import hm_folder_name, installed_path, partial_path
from core.settings import get_setting, libraries

_GAME_PROC_RE = re.compile(r"RainbowSix.*\.exe")
_WINE_ROOT_RE = re.compile(r"^[Zz]:\\")
_DEFAULT_ORDER = ("proton_experimental", "proton_hotfix")

NO_PROTON = "No Proton found"
GAME_RUNNING = "Close Rainbow Six Siege first"


def proc_environ(pid: int) -> dict[str, str]:
    try:
        return dict(psutil.Process(pid).environ())
    except (psutil.Error, OSError):
        return {}


def proc_cwd(pid: int) -> Path | None:
    try:
        return Path(psutil.Process(pid).cwd())
    except (psutil.Error, OSError):
        return None


def running_game_pids() -> list[int]:
    pids: list[int] = []
    for proc in psutil.process_iter(["name", "cmdline"]):
        cmdline = proc.info["cmdline"] or []
        haystack = " ".join(cmdline) if cmdline else (proc.info["name"] or "")
        if not _GAME_PROC_RE.search(haystack):
            continue
        if IS_WINDOWS or proc_environ(proc.pid).get("STEAM_COMPAT_DATA_PATH"):
            pids.append(proc.pid)
    return pids


def is_game_running() -> bool:
    return bool(running_game_pids())


def proc_exe_path(pid: int) -> Path | None:
    try:
        argv = psutil.Process(pid).cmdline()
    except (psutil.Error, OSError):
        return None
    for arg in argv:
        if not _GAME_PROC_RE.search(arg):
            continue
        if not IS_WINDOWS and _WINE_ROOT_RE.match(arg):
            arg = "/" + arg[3:].replace("\\", "/")
        return Path(arg)
    return None


def _game_folder(pid: int, roots: list[Path]) -> str | None:
    for path in (proc_exe_path(pid), proc_cwd(pid)):
        if path is None or not path.is_absolute():
            continue
        try:
            resolved = path.resolve()
        except OSError:
            continue
        for root in roots:
            try:
                rel = resolved.relative_to(root)
            except ValueError:
                continue
            if rel.parts:
                return rel.parts[0]
    return None


def _library_roots() -> list[Path]:
    return sorted(libraries(), key=lambda p: len(p.parts), reverse=True)


def running_game_folders() -> dict[str, list[int]]:
    roots = _library_roots()
    found: dict[str, list[int]] = {}
    for pid in running_game_pids():
        folder = _game_folder(pid, roots)
        if folder is not None:
            found.setdefault(folder, []).append(pid)
    return found


def is_season_running(key: str) -> bool:
    roots = _library_roots()
    names = {key, hm_folder_name(key)}
    for pid in running_game_pids():
        folder = _game_folder(pid, roots)
        if folder is None or folder in names:
            return True
    return False


def prefix_pids(prefix: Path) -> list[int]:
    compat = str(prefix)
    wineprefix = str(prefix / "pfx")
    pids: list[int] = []
    for proc in psutil.process_iter():
        env = proc_environ(proc.pid)
        if env.get("STEAM_COMPAT_DATA_PATH") == compat or env.get("WINEPREFIX") == wineprefix:
            pids.append(proc.pid)
    return pids


def stop_game(pids: list[int]) -> None:
    procs = []
    for pid in pids:
        try:
            proc = psutil.Process(pid)
            proc.terminate()
            procs.append(proc)
        except psutil.Error:
            continue
    _, alive = psutil.wait_procs(procs, timeout=2)
    for proc in alive:
        with contextlib.suppress(psutil.Error):
            proc.kill()


def _proton_entry(folder: Path) -> dict | None:
    binary = folder / "proton"
    if not binary.exists():
        return None
    internal = display = folder.name
    vdf = folder / "compatibilitytool.vdf"
    if vdf.exists():
        text = vdf.read_text(errors="replace")
        m = re.search(r'"compat_tools"\s*\{\s*"([^"]+)"', text)
        if m:
            internal = m.group(1)
            display_m = re.search(r'"display_name"\s+"([^"]+)"', text)
            display = display_m.group(1) if display_m else internal
    return {"display": display, "internal": internal, "binary": binary}


def _steam_libraries(root: Path) -> list[Path]:
    libraries = [root]
    with contextlib.suppress(OSError):
        text = (root / "steamapps" / "libraryfolders.vdf").read_text(errors="replace")
        for path in re.findall(r'"path"\s+"([^"]+)"', text):
            library = Path(path)
            if library not in libraries:
                libraries.append(library)
    return libraries


def _proton_folders() -> list[Path]:
    folders: list[Path] = []
    for root in STEAM_ROOTS:
        for library in _steam_libraries(root):
            folders += sorted((library / "steamapps" / "common").glob("Proton*"))
        compat = root / "compatibilitytools.d"
        if compat.is_dir():
            folders += sorted(compat.iterdir())
    if PROTON_DIR.is_dir():
        folders += sorted(PROTON_DIR.iterdir())
    return folders


def list_protons() -> list[dict]:
    legacy = {folder: (internal, display) for folder, internal, display in PROTON_BUILTIN}
    protons: list[dict] = []
    seen: set[Path] = set()
    for folder in _proton_folders():
        entry = _proton_entry(folder)
        if entry is None or entry["binary"].resolve() in seen:
            continue
        seen.add(entry["binary"].resolve())
        if folder.name in legacy:
            entry["internal"], entry["display"] = legacy[folder.name]
        protons.append(entry)
    return protons


def resolve_proton(settings: dict) -> dict | None:
    protons = list_protons()
    if not protons:
        return None
    choice = get_setting(settings, "proton", "")
    for proton in protons:
        if proton["internal"] == choice:
            return proton
    for internal in _DEFAULT_ORDER:
        for proton in protons:
            if proton["internal"] == internal:
                return proton
    return protons[-1]


def proton_env(prefix: Path) -> dict[str, str]:
    prefix.mkdir(parents=True, exist_ok=True)
    return {
        **os.environ,
        "STEAM_COMPAT_DATA_PATH": str(prefix),
        "STEAM_COMPAT_CLIENT_INSTALL_PATH": str(STEAM_DIR),
    }


def prune_prefixes() -> None:
    if not PREFIX_DIR.is_dir():
        return
    roots = libraries()
    if not all(root.exists() for root in roots) or is_game_running():
        return
    for prefix in PREFIX_DIR.iterdir():
        if not prefix.is_dir():
            continue
        key = prefix.name
        if (prefix / ".keep").exists():
            continue
        if any(
            (root / key).is_dir() or (root / hm_folder_name(key)).is_dir()
            for root in roots
        ):
            continue
        shutil.rmtree(prefix, ignore_errors=True)


def _delete_folder(folder: Path) -> dict | None:
    try:
        shutil.rmtree(folder)
    except OSError as e:
        return {"ok": False, "message": log.fail("Could not delete install", e)}
    return None


def _delete_prefix(key: str) -> dict | None:
    prefix = PREFIX_DIR / key
    if prefix.exists():
        try:
            shutil.rmtree(prefix)
        except OSError as e:
            return {"ok": False, "message": log.fail("Could not delete prefix", e)}
    return None


def _prefix_shared(key: str, hm: bool) -> bool:
    other = not hm
    return installed_path(key, other) is not None or partial_path(key, other) is not None


def uninstall_targets(key: str, hm: bool) -> dict | None:
    folder = installed_path(key, hm)
    prefix = PREFIX_DIR / key
    show_prefix = prefix.exists() and not _prefix_shared(key, hm)
    if folder is None and not show_prefix:
        return None
    return {
        "folder": str(folder) if folder is not None else "",
        "prefix": str(prefix) if show_prefix else "",
    }


def uninstall(key: str, hm: bool) -> dict:
    folder = installed_path(key, hm)
    if folder is None:
        return {"ok": False, "message": "Not installed"}
    if is_game_running():
        return {"ok": False, "message": GAME_RUNNING}
    error = _delete_folder(folder)
    if error is not None:
        return error
    if not _prefix_shared(key, hm):
        error = _delete_prefix(key)
        if error is not None:
            return error
    return {"ok": True, "message": ""}


def uninstall_item(key: str, hm: bool, item: str) -> dict:
    if item == "files":
        folder = installed_path(key, hm)
        if folder is None:
            return {"ok": False, "message": "Not installed"}
        if is_game_running():
            return {"ok": False, "message": GAME_RUNNING}
        error = _delete_folder(folder)
        if error is not None:
            return error
        prefix = PREFIX_DIR / key
        if prefix.is_dir() and not _prefix_shared(key, hm):
            with contextlib.suppress(OSError):
                (prefix / ".keep").touch()
        return {"ok": True, "message": "Game files deleted"}
    if item == "prefix":
        if is_game_running():
            return {"ok": False, "message": GAME_RUNNING}
        error = _delete_prefix(key)
        if error is not None:
            return error
        return {"ok": True, "message": "Proton prefix deleted"}
    return {"ok": False, "message": "Unknown item"}
