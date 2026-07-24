import json
import re
import tomllib
from collections.abc import Iterator
from pathlib import Path

from core.constants import (
    HELIOS_JSON,
    HM_FOLDER_SUFFIX,
    HM_LAUNCHER,
    MANIFEST_FILE,
    TL_LAUNCHER,
    TL_TOML,
)
from core.heatedmetal import write_helios_username
from core.settings import libraries
from core.throwbackloader import write_tl_toml

_INSTALL_PATTERN = re.compile(r"^Y\d+S\d+_")


def load_downloads() -> list[dict]:
    try:
        with open(MANIFEST_FILE, "rb") as f:
            data = tomllib.load(f)
    except FileNotFoundError:
        raise RuntimeError(f"manifest.toml not found at {MANIFEST_FILE}") from None
    except tomllib.TOMLDecodeError as e:
        raise RuntimeError(f"manifest.toml is malformed: {e}") from e

    defaults = {
        "app": data.get("app"),
        "depot_content": data.get("depot_content"),
        "depot_ww": data.get("depot_ww"),
        "depot_rus": data.get("depot_rus"),
    }
    return [
        {"key": key, **defaults, **block}
        for key, block in data.items()
        if isinstance(block, dict)
    ]


def local_downloads() -> list[Path]:
    return [
        d
        for root in libraries()
        if root.exists()
        for d in sorted(root.glob("*"))
        if d.is_dir() and _INSTALL_PATTERN.match(d.name)
    ]


def resolve_install(folder_name: str, downloads: list[dict]) -> tuple[dict, bool] | None:
    if folder_name.endswith(HM_FOLDER_SUFFIX):
        prefix = folder_name.removesuffix(HM_FOLDER_SUFFIX) + "_"
        for d in downloads:
            if d["key"].startswith(prefix) and d.get("hm"):
                return d, True
        return None
    for d in downloads:
        if d["key"] == folder_name:
            return d, False
    return None


def hm_display_name(download: dict) -> str:
    return f"{download['label'].split(' ', 1)[0]} Heated Metal"


def launcher_name(is_hm: bool) -> str:
    return HM_LAUNCHER if is_hm else TL_LAUNCHER


def is_installed(d: Path) -> bool:
    is_hm = d.name.endswith(HM_FOLDER_SUFFIX)
    if not (d / launcher_name(is_hm)).exists():
        return False
    return not is_hm or (d / HELIOS_JSON).exists()


def installed_downloads() -> list[Path]:
    return [d for d in local_downloads() if is_installed(d)]


def installed_tb_downloads(downloads: list[dict]) -> Iterator[tuple[Path, dict]]:
    for folder in installed_downloads():
        resolved = resolve_install(folder.name, downloads)
        if resolved is not None and not resolved[1]:
            yield folder, resolved[0]


def hm_folder_name(key: str) -> str:
    return f"{key.split('_', 1)[0]}{HM_FOLDER_SUFFIX}"


def variant_folder(key: str, hm: bool) -> str:
    return hm_folder_name(key) if hm else key


def installed_path(key: str, hm: bool) -> Path | None:
    folder = variant_folder(key, hm)
    for root in libraries():
        if is_installed(root / folder):
            return root / folder
    return None


def partial_path(key: str, hm: bool) -> Path | None:
    if installed_path(key, hm) is not None:
        return None
    folder = variant_folder(key, hm)
    for root in libraries():
        if (root / folder).is_dir():
            return root / folder
    return None


def installed_username(d: Path) -> str:
    toml_path = d / TL_TOML
    if toml_path.exists():
        try:
            text = toml_path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            text = ""
        m = re.search(r"""username\s*=\s*["']([^"']*)["']""", text)
        if m:
            return m.group(1)
    json_path = d / HELIOS_JSON
    if json_path.exists():
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError, OSError):
            return ""
        if isinstance(data, dict):
            return str(data.get("Username", ""))
    return ""


def write_download_username(d: Path, username: str) -> bool:
    if (d / TL_TOML).exists():
        write_tl_toml(d, username)
        return True
    json_path = d / HELIOS_JSON
    if json_path.exists():
        try:
            write_helios_username(json_path, username)
        except (json.JSONDecodeError, OSError):
            return False
        return True
    return False
