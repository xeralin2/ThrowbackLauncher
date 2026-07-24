import json
import math
import os
import shutil
import ssl
import threading
import time
import urllib.error
import urllib.request
import zipfile
from collections.abc import Callable
from pathlib import Path

import truststore

from core import log
from core.constants import (
    API_CACHE_FILE,
    BIN_DIR,
    DD_BIN,
    DD_MEMBER,
    DD_URL,
    DD_ZIP,
    IS_WINDOWS,
)
from core.reporter import NullReporter, Reporter


SSL_CONTEXT = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)


class Cancelled(Exception):
    pass


class RateLimited(Exception):
    def __init__(self, reset: str = "") -> None:
        super().__init__("GitHub rate limit reached")
        self.minutes = _reset_minutes(reset)

    def message(self) -> str:
        base = "GitHub rate limit reached"
        if self.minutes <= 0:
            return f"{base}, try again later"
        unit = "minute" if self.minutes == 1 else "minutes"
        return f"{base}, try again in {self.minutes} {unit}"


def _reset_minutes(reset: str) -> int:
    try:
        remaining = int(reset) - time.time()
    except ValueError:
        return 0
    return math.ceil(remaining / 60) if remaining > 0 else 0


_api_cache_lock = threading.Lock()


def _api_cache_read() -> dict:
    try:
        data = json.loads(API_CACHE_FILE.read_text())
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


API_CACHE_TTL = 600.0


def _api_cache_flush(cache: dict) -> None:
    API_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = API_CACHE_FILE.with_name(API_CACHE_FILE.name + ".tmp")
    tmp.write_text(json.dumps(cache))
    tmp.replace(API_CACHE_FILE)


def _api_cache_store(api_url: str, etag: str, data: dict) -> None:
    with _api_cache_lock:
        cache = _api_cache_read()
        cache[api_url] = {"etag": etag, "data": data, "ts": time.time()}
        _api_cache_flush(cache)


def invalidate_api_cache() -> None:
    with _api_cache_lock:
        cache = _api_cache_read()
        for entry in cache.values():
            if isinstance(entry, dict):
                entry["ts"] = 0
        if cache:
            _api_cache_flush(cache)


def _github_json(api_url: str, bypass_ttl: bool = False) -> dict:
    with _api_cache_lock:
        entry = _api_cache_read().get(api_url)
    fresh = isinstance(entry, dict) and entry.get("etag") and "data" in entry
    if fresh and not bypass_ttl and 0 <= time.time() - entry.get("ts", 0) < API_CACHE_TTL:
        return entry["data"]
    headers = {"User-Agent": "Throwback"}
    if fresh:
        headers["If-None-Match"] = entry["etag"]
    req = urllib.request.Request(api_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT) as r:
            data = json.load(r)
            etag = r.headers.get("ETag", "")
    except urllib.error.HTTPError as exc:
        if exc.code == 304 and isinstance(entry, dict):
            _api_cache_store(api_url, entry["etag"], entry["data"])
            return entry["data"]
        if exc.code == 429 or (exc.code == 403 and exc.headers.get("x-ratelimit-remaining") == "0"):
            raise RateLimited(exc.headers.get("x-ratelimit-reset", "")) from exc
        raise
    if etag:
        _api_cache_store(api_url, etag, data)
    return data


def _fetch_part(url: str, part: Path, on_progress: Callable[[float], None] | None,
                cancelled: Callable[[], bool] | None) -> None:
    offset = part.stat().st_size if part.exists() else 0
    headers = {"User-Agent": "Throwback"}
    if offset:
        headers["Range"] = f"bytes={offset}-"
    req = urllib.request.Request(url, headers=headers)
    try:
        r = urllib.request.urlopen(req, timeout=30, context=SSL_CONTEXT)
    except urllib.error.HTTPError as exc:
        if exc.code == 416 and offset:
            return
        raise
    with r:
        if offset and r.status != 206:
            offset = 0
        length = r.headers.get("Content-Length")
        try:
            total = offset + int(length) if length else 0
        except ValueError:
            total = 0
        with open(part, "ab" if offset else "wb") as f:
            done = offset
            if on_progress is not None and total > 0:
                on_progress(min(done / total, 1.0))
            while chunk := r.read(65536):
                if cancelled is not None and cancelled():
                    raise Cancelled
                f.write(chunk)
                done += len(chunk)
                if on_progress is not None and total > 0:
                    on_progress(min(done / total, 1.0))
            if 0 < total != f.tell():
                raise OSError(f"incomplete download ({f.tell()} of {total} bytes)")


def fetch_to(url: str, dest: Path, on_progress: Callable[[float], None] | None = None,
             cancelled: Callable[[], bool] | None = None) -> None:
    part = dest.with_name(dest.name + ".part")
    part.unlink(missing_ok=True)
    last: Exception | None = None
    for attempt in range(3):
        if attempt:
            time.sleep(2)
        try:
            _fetch_part(url, part, on_progress, cancelled)
            last = None
            break
        except Cancelled:
            part.unlink(missing_ok=True)
            raise
        except urllib.error.HTTPError as exc:
            last = exc
            if 400 <= exc.code < 500 and exc.code != 429:
                break
        except OSError as exc:
            last = exc
    if last is not None:
        part.unlink(missing_ok=True)
        raise last
    part.replace(dest)


def _find_asset(data: dict, suffix: str, prefix: str = "") -> str | None:
    return next(
        (
            a["browser_download_url"]
            for a in data["assets"]
            if a["name"].startswith(prefix) and a["name"].endswith(suffix)
        ),
        None,
    )


def github_asset(api_url: str, suffix: str, prefix: str = "") -> tuple[str, str]:
    data = _github_json(api_url)
    url = _find_asset(data, suffix, prefix)
    if url is None:
        data = _github_json(api_url, bypass_ttl=True)
        url = _find_asset(data, suffix, prefix)
    if url is None:
        raise LookupError(f"no release asset matching {prefix}*{suffix}")
    return data["tag_name"], url


def github_tag(api_url: str) -> str:
    return _github_json(api_url)["tag_name"]


def github_body(api_url: str) -> str:
    return _github_json(api_url).get("body") or ""


def ensure_depotdownloader(reporter: Reporter | None = None, force: bool = False) -> Path | None:
    if DD_BIN.exists() and not force and os.access(DD_BIN, os.X_OK):
        return DD_BIN

    reporter = reporter or NullReporter()
    reporter.update("Fetching DepotDownloader")
    BIN_DIR.mkdir(parents=True, exist_ok=True)
    part = DD_BIN.with_name(DD_BIN.name + ".part")
    try:
        fetch_to(DD_URL, DD_ZIP, on_progress=reporter.progress)
        with zipfile.ZipFile(DD_ZIP) as z, z.open(DD_MEMBER) as src, open(part, "wb") as f:
            shutil.copyfileobj(src, f)
        if not IS_WINDOWS:
            part.chmod(part.stat().st_mode | 0o111)
        part.replace(DD_BIN)
    except Exception as e:
        reporter.fail(log.fail("DepotDownloader download failed", e))
        return None
    finally:
        part.unlink(missing_ok=True)
        DD_ZIP.unlink(missing_ok=True)
    return DD_BIN


def depot_commands(download: dict, steam_account: str, target: Path,
                   max_downloads: int) -> list[dict]:
    depots: list[tuple[int, str, str, bool]] = [
        (download["depot_ww"], download["manifest_ww"], "Worldwide", False),
        (download["depot_rus"], download["manifest_rus"], "Russian", True),
        (download["depot_content"], download["manifest_content"], "Content", False),
    ]
    common = [
        "-app", str(download["app"]),
        "-username", steam_account,
        "-remember-password",
        "-dir", str(target),
        "-validate",
        "-max-downloads", str(max_downloads),
    ]
    return [
        {
            "args": ["-depot", str(depot_id), "-manifest", manifest_id, *common],
            "name": name,
            "optional": optional,
        }
        for depot_id, manifest_id, name, optional in depots
    ]
