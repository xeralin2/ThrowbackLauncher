<p>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/night.svg">
    <img alt="Throwback Launcher" src=".github/day.svg" height="42">
  </picture>
</p>

<p>
  <a href="https://github.com/xeralin2/ThrowbackLauncher/releases/latest"><img alt="latest release" src="https://img.shields.io/github/v/release/xeralin2/ThrowbackLauncher?style=flat&color=c0152a" /></a>
  <a href="https://github.com/xeralin2/ThrowbackLauncher/releases"><img alt="downloads" src="https://img.shields.io/github/downloads/xeralin2/ThrowbackLauncher/total?style=flat&color=c0152a" /></a>
  <a href="https://discord.gg/r6s-operation-throwback-2-0-1092820800203141130"><img alt="discord" src="https://img.shields.io/discord/1092820800203141130?style=flat&label=discord&color=e8e0d5" /></a>
</p>

Throwback Launcher downloads, manages and launches every older season of Rainbow Six Siege.

<br>

**Windows**

1. Download `Installer.exe` from the [latest release](https://github.com/xeralin2/ThrowbackLauncher/releases/latest)
2. Run it and pick an install folder, or keep the default `%LOCALAPPDATA%\ThrowbackLauncher`

**Linux**

1. Download `ThrowbackLauncher.AppImage` from the [latest release](https://github.com/xeralin2/ThrowbackLauncher/releases/latest)
2. Run `chmod +x ThrowbackLauncher.AppImage` in a terminal and open it

<br>

**Building**

For a local run on Linux you need [pnpm](https://pnpm.io/) and Python 3.12 or newer.

```sh
git clone https://github.com/xeralin2/ThrowbackLauncher.git
cd ThrowbackLauncher
pnpm -C next install
python -m venv .venv && .venv/bin/pip install -r app/requirements.txt
./run.sh
```
