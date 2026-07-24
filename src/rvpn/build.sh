#!/bin/sh
set -e
cd "$(dirname "$0")"
make
mkdir -p ../../bin/rvpn
cp build/tap_bridge build/rvpnnetmp.sys build/adapter_hook.dll \
   build/rvpn_launcher.exe build/netsh.exe build/netsh64.exe build/drvinst.exe \
   ../../bin/rvpn/
cp assets/OpenSans-Regular.ttf assets/OpenSans-Bold.ttf assets/OpenSans-LICENSE.txt \
   ../../bin/rvpn/
echo "built + deployed -> ../../bin/rvpn/"
