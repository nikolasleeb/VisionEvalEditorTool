#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

python3 -m PyInstaller --clean --noconfirm packaging/editor-backend.spec

TARGET_TRIPLE="$(rustc -Vv | awk '/host:/ { print $2 }')"
EXT=""
if [[ "${OS:-}" == "Windows_NT" ]]; then
  EXT=".exe"
fi

mkdir -p desktop/src-tauri/binaries
cp "dist/vision-eval-editor-backend${EXT}" "desktop/src-tauri/binaries/vision-eval-editor-backend-${TARGET_TRIPLE}${EXT}"

echo "Prepared Editor backend sidecar for ${TARGET_TRIPLE}."
