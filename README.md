<p>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/wordmark-dark.svg">
    <img alt="Throwback Launcher" src=".github/wordmark-light.svg" height="48">
  </picture>
</p>

<p>
  <a href="https://github.com/xeralin/ThrowbackLauncher/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/xeralin/ThrowbackLauncher?style=flat&color=c0152a" /></a>
  <a href="https://github.com/xeralin/ThrowbackLauncher/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/xeralin/ThrowbackLauncher/total?style=flat&color=e0405a" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/xeralin/ThrowbackLauncher?style=flat&color=e8e0d5" /></a>
</p>

Throwback Launcher downloads, manages and launches every older season of Rainbow Six Siege, built for **Operation Throwback** and **Heated Metal**. It runs on Linux and Windows and includes Liberator and Discord Rich Presence.

### Installation

**Windows**

1. Download `Launcher.exe` from the [latest release](https://github.com/xeralin/ThrowbackLauncher/releases/latest)
2. Run it and pick an install folder, or keep the default `%LOCALAPPDATA%\ThrowbackLauncher`

> [!TIP]
> No installer needed: download `Content.zip` instead, extract it anywhere and run `app\Launcher.exe`. The launcher keeps its data next to the `app` folder and updates itself the same way.

**Linux**

1. Download `Launcher.AppImage` from the [latest release](https://github.com/xeralin/ThrowbackLauncher/releases/latest)
2. Run `chmod +x Launcher.AppImage` in a terminal and open it
3. Make sure native Steam is installed — Flatpak and Snap are not supported

### Usage

Pick a season under **Download** and log in with your Steam account. For supported seasons, the launcher offers **Heated Metal** before the download starts. Once a season is installed, press **Play** — on Linux the launcher runs it through Proton from your Steam install.

### Building

For a local run you need [pnpm](https://pnpm.io/) and Python 3.12 or newer.

```sh
git clone https://github.com/xeralin/ThrowbackLauncher.git
cd Launcher
pnpm -C next install
python -m venv .venv && .venv/bin/pip install -r app/requirements.txt
./run.sh
```
