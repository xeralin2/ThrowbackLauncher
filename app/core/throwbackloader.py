import os
import re
import shutil
import tomllib
import zipfile
from pathlib import Path

from core import log
from core.constants import (
    TL_API_URL,
    TL_DIR,
    TL_DLLS_COMMON,
    TL_EXTRACT,
    TL_LAUNCHER,
    TL_LOADERS,
    TL_TOML,
    TL_VERSION_FILE,
)
from core.depot import RateLimited, fetch_to, github_asset
from core.reporter import NullReporter, Reporter


def ensure_tl(reporter: Reporter | None = None, force: bool = False) -> bool:
    if all((TL_DIR / f).exists() for f in TL_EXTRACT) and not force:
        return True

    reporter = reporter or NullReporter()
    reporter.update("Fetching ThrowbackLoader")
    TL_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = TL_DIR / "tl.zip"
    tmp_dir = TL_DIR / ".tl.tmp"
    try:
        tag, asset_url = github_asset(TL_API_URL, ".zip")
        fetch_to(asset_url, zip_path, on_progress=reporter.progress)
        shutil.rmtree(tmp_dir, ignore_errors=True)
        with zipfile.ZipFile(zip_path) as z:
            for name in TL_EXTRACT:
                z.extract(name, tmp_dir)
        for name in TL_EXTRACT:
            os.replace(tmp_dir / name, TL_DIR / name)
        (TL_DIR / TL_VERSION_FILE).write_text(tag)
    except RateLimited:
        raise
    except Exception as e:
        reporter.fail(log.fail("ThrowbackLoader download failed", e))
        return False
    finally:
        zip_path.unlink(missing_ok=True)
        shutil.rmtree(tmp_dir, ignore_errors=True)
    return True


def write_tl_toml(target_dir: Path, username: str) -> None:
    config = target_dir / TL_TOML
    config.write_text(
        re.sub(
            r"""username\s*=\s*["'][^"']*["']""",
            f"username = '{username}'",
            config.read_text(encoding="utf-8"),
            count=1,
        ),
        encoding="utf-8",
    )


def read_tl_tools(target_dir: Path) -> list[str]:
    try:
        data = tomllib.loads((target_dir / TL_TOML).read_text(encoding="utf-8"))
    except (OSError, tomllib.TOMLDecodeError):
        return []
    tools = data.get("Launch", {}).get("tools", [])
    return [t for t in tools if isinstance(t, str)]


def _toml_str(value: str) -> str:
    if "'" not in value:
        return f"'{value}'"
    esc = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{esc}"'


def write_tl_tools(target_dir: Path, tools: list[str]) -> None:
    config = target_dir / TL_TOML
    line = "tools = [" + ", ".join(_toml_str(t) for t in tools) + "]"
    text = config.read_text(encoding="utf-8")
    updated, count = re.subn(r"(?m)^tools\s*=.*$", lambda _: line, text, count=1)
    if not count:
        updated, count = re.subn(
            r"(?m)^\[Launch\]\s*$", lambda m: f"{m.group(0)}\n{line}", text, count=1
        )
    if not count:
        raise OSError("Config.toml has no [Launch] section")
    config.write_text(updated, encoding="utf-8")


def apply_tl(target_dir: Path, username: str) -> None:
    tools = read_tl_tools(target_dir)
    for name in (*TL_DLLS_COMMON, *TL_LOADERS, TL_TOML):
        shutil.copy2(TL_DIR / name, target_dir / name)
    write_tl_toml(target_dir, username)
    if tools:
        write_tl_tools(target_dir, tools)


def write_launcher(target_dir: Path, reporter: Reporter | None = None) -> None:
    src = TL_DIR / TL_LAUNCHER
    if not src.exists() and not ensure_tl(reporter):
        raise OSError("ThrowbackLoader download failed")
    shutil.copy2(src, target_dir / TL_LAUNCHER)
