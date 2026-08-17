import re
import tomllib
from pathlib import Path

from core.constants import DEFAULT_DOWNLOADS_DIR, SETTINGS_FILE

_BARE_KEY = re.compile(r"^[A-Za-z0-9_-]+$")

warning: str | None = None


def load_settings() -> dict:
    global warning
    try:
        with SETTINGS_FILE.open("rb") as f:
            return tomllib.load(f)
    except OSError:
        return {}
    except ValueError:
        broken = SETTINGS_FILE.with_name(SETTINGS_FILE.name + ".broken")
        try:
            SETTINGS_FILE.replace(broken)
            warning = f"Settings were malformed and reset, backup saved as {broken.name}"
        except OSError:
            warning = "Settings were malformed and reset"
        return {}


def toml_str(value: str) -> str:
    if "'" not in value and not any(ord(c) < 0x20 or c == "\x7f" for c in value):
        return f"'{value}'"
    esc = value.replace("\\", "\\\\").replace('"', '\\"')
    esc = "".join(f"\\u{ord(c):04X}" if ord(c) < 0x20 or c == "\x7f" else c for c in esc)
    return f'"{esc}"'


def _fmt_value(value: object) -> str:
    if isinstance(value, str):
        return toml_str(value)
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, list):
        return f"[{', '.join(_fmt_value(item) for item in value)}]"
    if isinstance(value, dict):
        items = ", ".join(
            f"{_fmt_key(str(key))} = {_fmt_value(val)}" for key, val in value.items()
        )
        return f"{{ {items} }}"
    return str(value)


def _fmt_key(key: str) -> str:
    return key if _BARE_KEY.fullmatch(key) else _fmt_value(key)


def save_settings(settings: dict) -> None:
    lines = ["[settings]"]
    for k, v in settings.get("settings", {}).items():
        lines.append(f"{_fmt_key(k)} = {_fmt_value(v)}")
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = SETTINGS_FILE.with_name(SETTINGS_FILE.name + ".tmp")
    tmp.write_text("\n".join(lines) + "\n", encoding="utf-8")
    tmp.replace(SETTINGS_FILE)


def get_setting[T](settings: dict, key: str, default: T) -> T:
    return settings.get("settings", {}).get(key, default)


def set_setting(settings: dict, key: str, value: object) -> None:
    settings.setdefault("settings", {})[key] = value


def _resolve_libraries(values: list[str]) -> list[Path]:
    roots: list[Path] = []
    for value in values:
        if not value:
            continue
        path = Path(value).resolve()
        if path not in roots:
            roots.append(path)
    if DEFAULT_DOWNLOADS_DIR not in roots:
        roots.append(DEFAULT_DOWNLOADS_DIR)
    return roots


_libraries_current: list[Path] | None = None


def libraries() -> list[Path]:
    if _libraries_current is None:
        set_libraries(get_setting(load_settings(), "libraries", []))
    return _libraries_current


def default_library() -> Path:
    return libraries()[0]


def set_libraries(values: object) -> None:
    global _libraries_current
    stored = [v for v in values if isinstance(v, str)] if isinstance(values, list) else []
    _libraries_current = _resolve_libraries(stored)
