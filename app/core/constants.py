import contextlib
import hashlib
import os
import platform
import re
import sys
from pathlib import Path

from layout import APP_SUBDIR, DIR_NAME, PENDING_SUBDIR, PREVIOUS_SUBDIR

VERSION = "0.0.2"


def version_tuple(v: str) -> tuple[int, ...]:
    return tuple(int(p) for p in v.split("."))


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FROZEN = bool(getattr(sys, "frozen", False)) or "__compiled__" in globals()
IS_WINDOWS = sys.platform.startswith("win")


_INSTALL_SUBDIRS = (APP_SUBDIR, PENDING_SUBDIR, PREVIOUS_SUBDIR)


def _asset_root() -> Path:
    if FROZEN:
        return Path(sys.executable).resolve().parent
    return PROJECT_ROOT


def user_data_base() -> Path:
    if IS_WINDOWS:
        return Path(os.environ.get("LOCALAPPDATA") or str(Path.home() / "AppData" / "Local"))
    return Path(os.environ.get("XDG_DATA_HOME") or str(Path.home() / ".local" / "share"))


def _data_root() -> Path:
    if not FROZEN:
        return PROJECT_ROOT
    if IS_WINDOWS:
        return ASSET_ROOT.parent if ASSET_ROOT.name in _INSTALL_SUBDIRS else ASSET_ROOT
    return user_data_base() / DIR_NAME


ASSET_ROOT = _asset_root()
DATA_ROOT = _data_root()
SELF_UPDATABLE = FROZEN and (
    ASSET_ROOT.name == APP_SUBDIR if IS_WINDOWS else bool(os.environ.get("APPIMAGE"))
)
_ROOT_HASH = hashlib.blake2s(str(DATA_ROOT).encode(), digest_size=4).hexdigest()
INSTANCE_KEY = f"{DIR_NAME}-{_ROOT_HASH}"

MANIFEST_FILE = ASSET_ROOT / "manifest.toml"
NEXT_OUT_DIR = ASSET_ROOT / "next" / "out"
ICON_FILE = ASSET_ROOT / "icon.png" if FROZEN else ASSET_ROOT / ".github" / "icon.png"

SETTINGS_FILE = DATA_ROOT / "settings.toml"
BIN_DIR = DATA_ROOT / "bin"
API_CACHE_FILE = BIN_DIR / "api_cache.json"
LOG_FILE = BIN_DIR / "log.txt"


DEFAULT_DOWNLOADS_DIR = (DATA_ROOT / "downloads").resolve()


def _os_arch() -> tuple[str, str]:
    machine = platform.machine().lower()
    arch = "arm64" if machine in ("arm64", "aarch64") else "x64"
    return ("windows", arch) if IS_WINDOWS else ("linux", arch)


_OS, _ARCH = _os_arch()

TL_DIR = BIN_DIR / "tl"
DD_MEMBER = "DepotDownloader.exe" if IS_WINDOWS else "DepotDownloader"
_DD_ASSET = f"DepotDownloader-{_OS}-{_ARCH}.zip"
DD_BIN = BIN_DIR / DD_MEMBER
DD_ZIP = BIN_DIR / _DD_ASSET
DD_URL = f"https://github.com/SteamRE/DepotDownloader/releases/latest/download/{_DD_ASSET}"
DD_API_URL = "https://api.github.com/repos/SteamRE/DepotDownloader/releases/latest"

LIBERATOR_BIN = ASSET_ROOT / "bin" / "Liberator.exe"
LIBERATOR_PORT_FILE = DATA_ROOT / "liberator" / "bridge.port"

TL_API_URL = "https://api.github.com/repos/xeralin/ThrowbackLoader/releases/latest"
TL_DLLS_COMMON = ("defaultargs.dll", "steam_api64.dll")
TL_LOADERS = ("uplay_r1_loader64.dll", "upc_r1_loader64.dll", "upc_r2_loader64.dll")
TL_TOML = "Config.toml"
TL_LAUNCHER = "LaunchR6.exe"
TL_VERSION_FILE = ".version"
TL_EXTRACT = (*TL_DLLS_COMMON, *TL_LOADERS, TL_TOML, TL_LAUNCHER)

HM_FOLDER_SUFFIX = "_HeatedMetal"

HELIOS_DIR = BIN_DIR / "hl"
if IS_WINDOWS:
    SEVENZ_ASSET = "7zr.exe"
    SEVENZ_BIN = BIN_DIR / "7zr.exe"
else:
    SEVENZ_ASSET = f"{_OS}-{_ARCH}.tar.xz"
    SEVENZ_BIN = BIN_DIR / "7zz"

UPDATE_API_URL = "https://api.github.com/repos/xeralin2/ThrowbackLauncher/releases/latest"
SEVENZ_API_URL = "https://api.github.com/repos/ip7z/7zip/releases/latest"
HELIOS_RAW_FMT = "https://raw.githubusercontent.com/xeralin/HeliosLoader/main/{name}"
HM_API_URL = "https://api.github.com/repos/DataCluster0/HeatedMetal/releases/latest"
HM_RELEASE_URL_FMT = "https://github.com/DataCluster0/HeatedMetal/releases/download/{tag}/HeatedMetal.7z"

HELIOS_JSON = "HeliosLoader.json"
HM_LAUNCHER = "RainbowSix.exe"
HELIOS_FILES = (
    HELIOS_JSON,
    "steam_api64.dll",
    "upc_r2_loader64.dll",
    "uplay_r1_loader64.dll",
    "uplay_r2_loader64.dll",
)

RVPN_TAP_DEV = "radminvpn0"
RVPN_BIN_DIR = ASSET_ROOT / "bin" / "rvpn"
RVPN_STATE_DIR = DATA_ROOT / "rvpn"
RVPN_PREFIX = RVPN_STATE_DIR / "wineprefix"
RVPN_MAC_FILE = RVPN_STATE_DIR / "mac"
RVPN_FONTS_DIR = RVPN_STATE_DIR / "fonts"

WINE_DIR = BIN_DIR / "wine"
WINE_BIN = WINE_DIR / "bin" / "wine"
WINE_API_URL = "https://api.github.com/repos/Kron4ek/Wine-Builds/releases/latest"
WINE_ASSET_SUFFIX = "staging-amd64-wow64.tar.xz"


_STEAM_HOME_DIRS = (
    ".local/share/Steam",
    ".var/app/com.valvesoftware.Steam/data/Steam",
    ".steam/steam",
    "snap/steam/common/.steam/root",
)


def _steam_roots() -> list[Path]:
    if IS_WINDOWS:
        import winreg

        with contextlib.suppress(OSError):
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam") as key:
                value, _ = winreg.QueryValueEx(key, "SteamPath")
            if value:
                return [Path(value)]
        program_files = os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)")
        return [Path(program_files) / "Steam"]
    roots: list[Path] = []
    for name in _STEAM_HOME_DIRS:
        path = Path.home() / name
        if path.is_dir() and path.resolve() not in roots:
            roots.append(path.resolve())
    return roots


STEAM_ROOTS = _steam_roots()
STEAM_DIR = STEAM_ROOTS[0] if STEAM_ROOTS else Path.home() / ".local" / "share" / "Steam"

PREFIX_DIR = DATA_ROOT / "prefixes"
PROTON_DIR = BIN_DIR / "proton"

PROTON_BUILTIN = (
    ("Proton - Experimental", "proton_experimental", "Proton Experimental"),
    ("Proton Hotfix", "proton_hotfix", "Proton Hotfix"),
)

DEFAULT_USERNAME = "ThrowbackUser"
DEFAULT_MAX_DOWNLOADS = 25
DOWNLOADS_MIN = 1
DOWNLOADS_MAX = 100

NAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+$")
MAX_USERNAME_LENGTH = 16

HEX_PATTERN = re.compile(r"^#[0-9a-fA-F]{6}$")
DEFAULT_ACCENT = "#c0152a"
DEFAULT_BAR_FILL = "#c388e3"
DEFAULT_BAR_STRIPE = "#dcbaef"

EVENT_SEASONS = {
    "Y3S1_Chimera": "fury",
    "Y3S3_GrimSky": "events",
    "Y4S1_BurntHorizon": "events",
    "Y4S2_PhantomSight": "events",
    "Y4S3_EmberRise": "events",
    "Y4S4_ShiftingTides": "events",
    "Y5S1_VoidEdge": "events",
}

TEXTURE_QUALITIES = ("Low", "Medium", "High", "Very High", "Ultra")
TEXTURE_RX = re.compile(r"textures(\d)")
