import contextlib
import json
import os
import shutil
import subprocess
import tarfile
import threading
from collections.abc import Callable
from pathlib import Path

from core import log
from core.constants import (
    BIN_DIR,
    HELIOS_DIR,
    HELIOS_FILES,
    HELIOS_JSON,
    HELIOS_RAW_FMT,
    HM_API_URL,
    HM_RELEASE_URL_FMT,
    IS_WINDOWS,
    SEVENZ_API_URL,
    SEVENZ_ASSET,
    SEVENZ_BIN,
)
from core.depot import RateLimited, fetch_to, github_asset
from core.reporter import NullReporter, Reporter

_last_error = threading.local()
_hm_release: tuple[str, str] | None = None


def clear_release_cache() -> None:
    global _hm_release
    _hm_release = None


def _set_error(detail: str) -> None:
    _last_error.value = detail


def fail_message(fail_text: str) -> str:
    return getattr(_last_error, "value", "") or fail_text


def _default_args(mod_dir: Path) -> Path | None:
    for name in ("DefaultArgs.dll", "defaultargs.dll"):
        candidate = mod_dir / name
        if candidate.exists():
            return candidate
    return None


def _hm_mod_complete(mod_dir: Path) -> bool:
    return _default_args(mod_dir) is not None and (mod_dir / "HeatedMetal").is_dir()


def ensure_7zz(update: Callable[[str], None], force: bool = False,
               on_progress: Callable[[float], None] | None = None) -> Path | None:
    if SEVENZ_BIN.exists() and not force:
        return SEVENZ_BIN

    update("Fetching 7z")
    BIN_DIR.mkdir(parents=True, exist_ok=True)
    try:
        _, asset_url = github_asset(SEVENZ_API_URL, SEVENZ_ASSET)
        if IS_WINDOWS:
            fetch_to(asset_url, SEVENZ_BIN, on_progress=on_progress)
            return SEVENZ_BIN
        tarxz_path = BIN_DIR / "_7zz.tar.xz"
        tmp_dir = BIN_DIR / ".7zz.tmp"
        try:
            fetch_to(asset_url, tarxz_path, on_progress=on_progress)
            with tarfile.open(tarxz_path) as t:
                t.extract("7zz", tmp_dir, filter="data")
            tmp_bin = tmp_dir / "7zz"
            tmp_bin.chmod(tmp_bin.stat().st_mode | 0o111)
            os.replace(tmp_bin, SEVENZ_BIN)
            return SEVENZ_BIN
        finally:
            tarxz_path.unlink(missing_ok=True)
            shutil.rmtree(tmp_dir, ignore_errors=True)
    except RateLimited:
        raise
    except Exception as e:
        _set_error(log.fail("7z download failed", e))
        return None


def ensure_helios(update: Callable[[str], None], force: bool = False) -> Path | None:
    if not force and all((HELIOS_DIR / name).exists() for name in HELIOS_FILES):
        return HELIOS_DIR

    update("Fetching HeliosLoader")
    HELIOS_DIR.mkdir(parents=True, exist_ok=True)
    try:
        for name in HELIOS_FILES:
            fetch_to(HELIOS_RAW_FMT.format(name=name), HELIOS_DIR / name)
    except Exception as e:
        _set_error(log.fail("HeliosLoader download failed", e))
        return None
    return HELIOS_DIR


def resolve_hm_release(hm_version: str) -> tuple[str, str] | None:
    global _hm_release
    if hm_version != "latest":
        return hm_version, HM_RELEASE_URL_FMT.format(tag=hm_version)
    if _hm_release is not None:
        return _hm_release
    try:
        resolved = github_asset(HM_API_URL, ".7z")
    except RateLimited:
        raise
    except Exception as e:
        _set_error(log.fail("Heated Metal release lookup failed", e))
        return None
    _hm_release = resolved
    return resolved


def _sevenz_error(rc: subprocess.CompletedProcess) -> str:
    stderr_line = next(
        (line.strip() for line in rc.stderr.decode(errors="replace").splitlines() if line.strip()),
        "",
    )
    return stderr_line or f"7z exited with code {rc.returncode}"


def _fetch_hm_mod(hm_version: str, tmp_dir: Path, update: Callable[[str], None],
                  on_progress: Callable[[float], None] | None = None,
                  ) -> tuple[str, Path] | None:
    if hm_version == "latest":
        update("Looking up Heated Metal release")
    resolved = resolve_hm_release(hm_version)
    if resolved is None:
        return None
    tag, asset_url = resolved

    update(f"Fetching Heated Metal {tag}")
    BIN_DIR.mkdir(parents=True, exist_ok=True)
    archive_path = BIN_DIR / "HeatedMetal.7z"
    try:
        fetch_to(asset_url, archive_path, on_progress=on_progress)
        mod_dir = _extract_hm_archive(archive_path, tmp_dir, update)
    except RateLimited:
        raise
    except Exception as e:
        _set_error(log.fail("Heated Metal download failed", e))
        return None
    finally:
        archive_path.unlink(missing_ok=True)
    if mod_dir is None:
        return None
    return tag, mod_dir


def _mod_root(extracted: Path) -> Path | None:
    if _hm_mod_complete(extracted):
        return extracted
    for child in extracted.iterdir():
        if child.is_dir() and _hm_mod_complete(child):
            return child
    return None


def _extract_hm_archive(archive: Path, tmp_dir: Path,
                        update: Callable[[str], None]) -> Path | None:
    sevenz = ensure_7zz(update)
    if sevenz is None:
        return None

    update(f"Extracting {archive.name}")
    try:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        tmp_dir.mkdir(parents=True)
        rc = subprocess.run(
            [str(sevenz), "x", "-y", f"-o{tmp_dir}", str(archive)],
            capture_output=True, check=False,
            creationflags=subprocess.CREATE_NO_WINDOW if IS_WINDOWS else 0,
        )
        if rc.returncode != 0:
            _set_error(_sevenz_error(rc))
            return None
        mod_dir = _mod_root(tmp_dir)
        if mod_dir is None:
            _set_error(f"{archive.name} does not contain the Heated Metal files")
        return mod_dir
    except Exception as e:
        _set_error(str(e))
        return None


_PF_SSE4_2_INSTRUCTIONS_AVAILABLE = 38
_PF_AVX_INSTRUCTIONS_AVAILABLE = 39


def hm_version_file(target_dir: Path) -> Path:
    return target_dir / "HeatedMetal" / ".version"


def hm_installed_version(target_dir: Path) -> str | None:
    try:
        return hm_version_file(target_dir).read_text().strip() or None
    except OSError:
        return None


def _detect_cpu_variant() -> str:
    if IS_WINDOWS:
        import ctypes

        present = ctypes.windll.kernel32.IsProcessorFeaturePresent
        if present(_PF_AVX_INSTRUCTIONS_AVAILABLE):
            return "AVX"
        if present(_PF_SSE4_2_INSTRUCTIONS_AVAILABLE):
            return "SSE"
        return ""
    with contextlib.suppress(OSError):
        for line in Path("/proc/cpuinfo").read_text().splitlines():
            if line.startswith("flags"):
                tokens = line.split()
                if "avx" in tokens:
                    return "AVX"
                if "sse4_2" in tokens:
                    return "SSE"
                break
    return ""


def write_helios_username(json_path: Path, username: str) -> None:
    config = json.loads(json_path.read_text(encoding="utf-8"))
    config["Username"] = username
    json_path.write_text(json.dumps(config, indent=2), encoding="utf-8")


def _install_helios(target_dir: Path, username: str) -> None:
    for name in HELIOS_FILES:
        shutil.copy2(HELIOS_DIR / name, target_dir / name)
    write_helios_username(target_dir / HELIOS_JSON, username)


def _apply_hm_mod(target_dir: Path, mod_dir: Path) -> None:
    for variant in ("DefaultArgs.dll", "defaultargs.dll"):
        (target_dir / variant).unlink(missing_ok=True)
    target_hm = target_dir / "HeatedMetal"
    if target_hm.exists():
        shutil.rmtree(target_hm)

    shutil.copy2(_default_args(mod_dir), target_dir / "defaultargs.dll")
    shutil.copytree(mod_dir / "HeatedMetal", target_hm)

    variant = _detect_cpu_variant()
    if variant:
        variant_dll = target_hm / f"HeatedMetal{variant}.dll"
        if variant_dll.exists():
            shutil.copy2(variant_dll, target_hm / "HeatedMetal.dll")

    notices = mod_dir / "ThirdPartyLegalNotices.txt"
    if notices.exists():
        shutil.copy2(notices, target_dir / "ThirdPartyLegalNotices.txt")


def apply_hm(target_dir: Path, username: str, download: dict,
             reporter: Reporter | None = None, refresh_helios: bool = False,
             archive: Path | None = None) -> bool:
    fail_text = "Heated Metal setup failed"
    _set_error("")
    reporter = reporter or NullReporter()
    tmp_dir = BIN_DIR / ".hm.tmp"
    try:
        if download.get("hm_beta"):
            if archive is None:
                _set_error("The Heated Metal archive is required")
                reporter.fail(fail_message(fail_text))
                return False
            version = archive.stem
            mod_dir = _extract_hm_archive(archive, tmp_dir, reporter.update)
        else:
            fetched = _fetch_hm_mod(download.get("hm_version", "latest"), tmp_dir,
                                    reporter.update, on_progress=reporter.progress)
            version, mod_dir = fetched if fetched is not None else ("", None)
        if mod_dir is None:
            reporter.fail(fail_message(fail_text))
            return False

        if ensure_helios(reporter.update, force=refresh_helios) is None:
            reporter.fail(fail_message(fail_text))
            return False

        reporter.update("Copying files")
        try:
            _install_helios(target_dir, username)
            _apply_hm_mod(target_dir, mod_dir)
            hm_version_file(target_dir).write_text(version)
        except OSError as e:
            _set_error(str(e))
            reporter.fail(fail_message(fail_text))
            return False

        reporter.succeed("Heated Metal applied")
        return True
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def remove_hm_files(target_dir: Path) -> None:
    target_hm = target_dir / "HeatedMetal"
    if target_hm.exists():
        shutil.rmtree(target_hm)
    for name in ("DefaultArgs.dll", "defaultargs.dll", "ThirdPartyLegalNotices.txt",
                 *HELIOS_FILES):
        (target_dir / name).unlink(missing_ok=True)
