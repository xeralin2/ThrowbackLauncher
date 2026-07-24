import os
import re
import shutil
import subprocess
import zipfile
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from tempfile import TemporaryDirectory

from core import log
from core.constants import (
    DD_API_URL,
    DD_BIN,
    DEFAULT_USERNAME,
    HM_API_URL,
    IS_WINDOWS,
    SELF_UPDATABLE,
    SEVENZ_API_URL,
    SEVENZ_BIN,
    TL_API_URL,
    TL_DIR,
    TL_EXTRACT,
    TL_VERSION_FILE,
    UPDATE_API_URL,
    VERSION,
    version_tuple,
)
from core.depot import (
    RateLimited,
    ensure_depotdownloader,
    fetch_to,
    github_asset,
    github_body,
    github_tag,
    invalidate_api_cache,
)
from core.heatedmetal import (
    apply_hm,
    clear_release_cache,
    ensure_7zz,
    fail_message,
    hm_installed_version,
    resolve_hm_release,
)
from core.manifest import (
    hm_folder_name,
    installed_tb_downloads,
    installed_username,
    is_installed,
    load_downloads,
)
from core.reporter import NullReporter, Reporter
from core.self_update import helper_argv, pending_dir
from core.settings import libraries
from core.steam import GAME_RUNNING, is_game_running
from core.throwbackloader import apply_tl, ensure_tl, write_launcher
from core.winspawn import spawn_detached
from layout import PENDING_FILE


def _newer(latest: str, current: str) -> bool:
    try:
        return version_tuple(latest) > version_tuple(current)
    except ValueError:
        return latest != current


def _binary_version(binary: Path, args: list[str], pattern: str) -> str | None:
    try:
        out = subprocess.run(
            [str(binary), *args],
            capture_output=True, text=True, timeout=30, check=False,
            creationflags=subprocess.CREATE_NO_WINDOW if IS_WINDOWS else 0,
        ).stdout
    except Exception:
        return None
    match = re.search(pattern, out)
    return match.group(1) if match else None


_throwback_release: dict | None = None


def _throwback_fetch() -> dict:
    global _throwback_release
    if _throwback_release is None:
        asset = "App.zip" if IS_WINDOWS else "Launcher.AppImage"
        tag, url = github_asset(UPDATE_API_URL, asset)
        _throwback_release = {"tag": tag, "url": url}
    return _throwback_release


def _throwback_latest() -> str:
    tag = _throwback_fetch()["tag"].removeprefix("v")
    version_tuple(tag)
    return tag


_ALERT_RX = re.compile(r"\[!\w+\]")
_HEADING_RX = re.compile(r"#{1,6}\s+(.+)")
_NUMBER_RX = re.compile(r"\d+[.)]\s+(.+)")


def _release_notes(api_url: str) -> Callable[[], list[dict]]:
    def notes() -> list[dict]:
        collected: list[dict] = []
        has_parent = False
        in_fence = False
        in_comment = False
        after_blank = True
        for line in github_body(api_url).splitlines():
            expanded = line.expandtabs(4)
            stripped = expanded.strip()
            if in_comment:
                in_comment = "-->" not in stripped
                continue
            if stripped.startswith(("```", "~~~")):
                in_fence = not in_fence
                has_parent = False
                after_blank = True
                continue
            if in_fence:
                continue
            if stripped.startswith("<!--") and "-->" not in stripped:
                in_comment = True
                continue
            if stripped.startswith(">"):
                stripped = stripped.lstrip("> ").strip()
                if _ALERT_RX.fullmatch(stripped):
                    continue
            if not stripped or set(stripped) <= set("-*_ "):
                has_parent = False
                after_blank = True
                continue
            heading = _HEADING_RX.fullmatch(stripped)
            if heading:
                has_parent = False
                after_blank = True
                collected.append(
                    {"text": heading.group(1).strip(), "level": 0, "kind": "heading"})
                continue
            indent = len(expanded) - len(expanded.lstrip())
            number = _NUMBER_RX.fullmatch(stripped)
            bullet = stripped.startswith(("- ", "* ", "+ "))
            if not bullet and number is None:
                if indent < 2:
                    has_parent = False
                if not after_blank and collected and collected[-1]["kind"] == "text":
                    collected[-1]["text"] += " " + stripped
                else:
                    collected.append({"text": stripped, "level": 0, "kind": "text"})
                after_blank = False
                continue
            if indent < 2:
                has_parent = True
            collected.append({
                "text": (number.group(1) if number else stripped[2:]).strip(),
                "level": 1 if indent >= 2 and has_parent else 0,
                "kind": "number" if number else "bullet",
            })
            after_blank = False
        return collected[:20]

    return notes


def _throwback_apply_windows(reporter: Reporter, url: str, tag: str) -> bool:
    pending = pending_dir()
    try:
        with TemporaryDirectory() as tmp:
            archive = Path(tmp) / "App.zip"
            reporter.update("Downloading update")
            fetch_to(url, archive, on_progress=reporter.progress)
            reporter.update("Preparing update")
            shutil.rmtree(pending, ignore_errors=True)
            pending.mkdir(parents=True)
            with zipfile.ZipFile(archive) as z:
                z.extractall(pending)
                names = z.namelist()
            missing = [n for n in names if not (pending / n).exists()]
            if missing:
                raise OSError(f"{len(missing)} update files are missing")
            (pending / PENDING_FILE).write_text(tag.removeprefix("v"), encoding="ascii")
        spawn_detached(helper_argv(pending))
    except BaseException:
        shutil.rmtree(pending, ignore_errors=True)
        raise
    return True


def _throwback_apply_appimage(reporter: Reporter, url: str) -> bool:
    appimage = os.environ.get("APPIMAGE", "")
    if not appimage:
        reporter.fail("Update failed, not running from an AppImage")
        return False
    target = Path(appimage)
    reporter.update("Downloading update")
    replacement = target.with_name(target.name + ".update")
    fetch_to(url, replacement, on_progress=reporter.progress)
    replacement.chmod(0o755)
    replacement.replace(target)
    return True


def _throwback_apply(reporter: Reporter | None = None) -> bool:
    if IS_WINDOWS and is_game_running():
        raise OSError(GAME_RUNNING)
    release = _throwback_fetch()
    reporter = reporter or NullReporter()
    try:
        if IS_WINDOWS:
            ok = _throwback_apply_windows(reporter, release["url"], release["tag"])
        else:
            ok = _throwback_apply_appimage(reporter, release["url"])
    except Exception as e:
        reporter.fail(log.fail("Update failed", e))
        return False
    if not ok:
        return False
    if IS_WINDOWS:
        reporter.update("Restarting to apply update")
    else:
        reporter.succeed(f"Updated to {release['tag'].removeprefix('v')}, restarting")
    return True


def _sevenz_apply(reporter: Reporter | None = None) -> bool:
    reporter = reporter or NullReporter()
    reporter.update("Updating 7z")
    if ensure_7zz(reporter.update, force=True, on_progress=reporter.progress) is None:
        reporter.fail(fail_message("7z update failed"))
        return False
    reporter.succeed("7z updated")
    return True


def _tl_current() -> str | None:
    f = TL_DIR / TL_VERSION_FILE
    return f.read_text().strip() if f.exists() else None


def _tl_apply(reporter: Reporter | None = None) -> bool:
    if is_game_running():
        raise OSError(GAME_RUNNING)
    if not ensure_tl(reporter, force=True):
        return False
    downloads = load_downloads()
    try:
        for folder, _ in installed_tb_downloads(downloads):
            username = installed_username(folder) or DEFAULT_USERNAME
            apply_tl(folder, username)
            write_launcher(folder)
    except BaseException:
        (TL_DIR / TL_VERSION_FILE).unlink(missing_ok=True)
        raise
    return True


def _hm_latest_installs() -> list[tuple[dict, Path]]:
    try:
        downloads = load_downloads()
    except Exception:
        return []
    installs: list[tuple[dict, Path]] = []
    for download in downloads:
        if download.get("hm_version") != "latest":
            continue
        for root in libraries():
            folder = root / hm_folder_name(download["key"])
            if is_installed(folder):
                installs.append((download, folder))
    return installs


def _hm_current() -> str | None:
    versions = [hm_installed_version(folder) for _, folder in _hm_latest_installs()]
    if not versions or any(v is None for v in versions):
        return None
    try:
        return min(versions, key=version_tuple)
    except ValueError:
        return min(versions)


def _hm_latest() -> str:
    resolved = resolve_hm_release("latest")
    if resolved is None:
        raise OSError("Heated Metal release lookup failed")
    return resolved[0]


def _hm_apply(reporter: Reporter | None = None) -> bool:
    installs = _hm_latest_installs()
    if not installs:
        return False
    if is_game_running():
        raise OSError(GAME_RUNNING)
    ok = True
    for download, folder in installs:
        username = installed_username(folder) or DEFAULT_USERNAME
        if not apply_hm(folder, username, download, reporter=reporter, refresh_helios=True):
            ok = False
    return ok


@dataclass
class Component:
    name: str
    present: Callable[[], bool]
    current: Callable[[], str | None]
    latest: Callable[[], str | None]
    apply: Callable[..., bool]
    restart: bool = False
    notes: Callable[[], list[dict]] | None = None
    target: str | None = None
    notes_value: list[dict] = field(default_factory=list)

    def pending(self, latest: str) -> str | None:
        current = self.current()
        if current is None or _newer(latest, current):
            self.target = latest
            return latest
        return None


COMPONENTS = [
    Component("Throwback Launcher", lambda: SELF_UPDATABLE,
              lambda: VERSION, _throwback_latest, _throwback_apply, restart=True,
              notes=_release_notes(UPDATE_API_URL)),
    Component("DepotDownloader", DD_BIN.exists,
              lambda: _binary_version(DD_BIN, ["--version"], r"v(\d+(?:\.\d+)+)"),
              lambda: github_tag(DD_API_URL).removeprefix("DepotDownloader_") or None,
              lambda reporter=None: ensure_depotdownloader(reporter, force=True) is not None,
              notes=_release_notes(DD_API_URL)),
    Component("7z", SEVENZ_BIN.exists,
              lambda: _binary_version(SEVENZ_BIN, [], r"7-Zip(?:\s+\([arz]\))?\s+(\d+(?:\.\d+)+)"),
              lambda: github_tag(SEVENZ_API_URL), _sevenz_apply),
    Component("ThrowbackLoader", lambda: all((TL_DIR / f).exists() for f in TL_EXTRACT),
              _tl_current, lambda: github_tag(TL_API_URL), _tl_apply,
              notes=_release_notes(TL_API_URL)),
    Component("Heated Metal", lambda: bool(_hm_latest_installs()),
              _hm_current, _hm_latest, _hm_apply,
              notes=_release_notes(HM_API_URL)),
]


def available(force: bool = False) -> tuple[list[Component], str]:
    global _throwback_release
    _throwback_release = None
    if force:
        invalidate_api_cache()
        clear_release_cache()
    present = [c for c in COMPONENTS if c.present()]
    if not present:
        return [], ""

    def probe(component: Component) -> tuple[str | None, str]:
        try:
            return component.latest(), ""
        except RateLimited:
            return None, "rate_limit"
        except Exception:
            return None, "error"

    with ThreadPoolExecutor(max_workers=len(present)) as ex:
        results = list(ex.map(probe, present))
    failures = {status for _, status in results if status}
    status = "rate_limit" if "rate_limit" in failures else ("error" if failures else "")
    pending = [
        c
        for c, (latest, _) in zip(present, results, strict=True)
        if latest is not None and c.pending(latest)
    ]
    for component in pending:
        if component.notes is not None:
            try:
                component.notes_value = component.notes()
            except Exception:
                component.notes_value = []
    return pending, status
