#!/bin/sh
set -e
cd "$(dirname "$0")"
sh shadow/build.sh
cargo build --release --target x86_64-pc-windows-gnu --bin runner
mkdir -p ../../bin
cp target/x86_64-pc-windows-gnu/release/runner.exe ../../bin/Liberator.exe
echo "liberator -> ../../bin/Liberator.exe"
