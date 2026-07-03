#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BIN_NAME="vision-eval-editor-backend"
BIN_DIR="desktop/src-tauri/binaries"
PYTHON_BIN="${PYTHON:-python3}"
mkdir -p "$BIN_DIR"

if [[ "${OS:-}" == "Windows_NT" ]] && command -v python >/dev/null 2>&1; then
  PYTHON_BIN="${PYTHON:-python}"
fi

build_backend() {
  local arch_name="$1"
  local runner=()

  if [[ "$arch_name" == "x86_64" && "$(uname -s)" == "Darwin" ]]; then
    runner=(arch -x86_64)
  fi

  if [[ "${#runner[@]}" -gt 0 ]]; then
    "${runner[@]}" "$PYTHON_BIN" -m PyInstaller --clean --noconfirm packaging/editor-backend.spec
  else
    "$PYTHON_BIN" -m PyInstaller --clean --noconfirm packaging/editor-backend.spec
  fi
}

copy_backend() {
  local target_triple="$1"
  local ext="${2:-}"
  cp "dist/${BIN_NAME}${ext}" "${BIN_DIR}/${BIN_NAME}-${target_triple}${ext}"
}

if [[ "${OS:-}" == "Windows_NT" ]]; then
  build_backend "windows"
  copy_backend "$(rustc -Vv | awk '/host:/ { print $2 }')" ".exe"
  echo "Prepared Editor backend sidecar for Windows."
  exit 0
fi

if [[ "$(uname -s)" == "Darwin" && "${TAURI_ENV_ARCH:-}" == "universal" ]]; then
  build_backend "arm64"
  cp "dist/${BIN_NAME}" "/tmp/${BIN_NAME}-aarch64"
  copy_backend "aarch64-apple-darwin"

  build_backend "x86_64"
  cp "dist/${BIN_NAME}" "/tmp/${BIN_NAME}-x86_64"
  copy_backend "x86_64-apple-darwin"

  lipo -create "/tmp/${BIN_NAME}-aarch64" "/tmp/${BIN_NAME}-x86_64" -output "${BIN_DIR}/${BIN_NAME}"
  cp "${BIN_DIR}/${BIN_NAME}" "${BIN_DIR}/${BIN_NAME}-universal-apple-darwin"
  chmod +x "${BIN_DIR}/${BIN_NAME}" "${BIN_DIR}/${BIN_NAME}-universal-apple-darwin"
  echo "Prepared universal Editor backend sidecar for macOS."
  exit 0
fi

build_backend "${TAURI_ENV_ARCH:-host}"
copy_backend "$(rustc -Vv | awk '/host:/ { print $2 }')"
echo "Prepared Editor backend sidecar for $(rustc -Vv | awk '/host:/ { print $2 }')."
