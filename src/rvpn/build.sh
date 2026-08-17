#!/bin/sh
set -e
cd "$(dirname "$0")"
make
mkdir -p ../../rvpn
cp build/tap_bridge build/dns_shim.so build/rvpnnetmp.sys build/adapter_hook.dll \
   build/rvpn_launcher.exe build/netsh.exe build/netsh64.exe build/drvinst.exe \
   ../../rvpn/
cp assets/OpenSans-Regular.ttf assets/OpenSans-Bold.ttf assets/OpenSans-LICENSE.txt \
   ../../rvpn/
echo "built + deployed -> ../../rvpn/"
