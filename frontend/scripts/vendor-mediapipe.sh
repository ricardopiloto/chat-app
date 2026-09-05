#!/usr/bin/env bash
# Copy MediaPipe WASM from node_modules into public/ for same-origin serving.
set -euo pipefail
ROOT="$(CDPATH="" cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/node_modules/@mediapipe/tasks-vision/wasm"
DEST="$ROOT/public/mediapipe/wasm"
if [[ ! -d "$SRC" ]]; then
  echo "vendor-mediapipe: $SRC missing (run npm install first)" >&2
  exit 1
fi
mkdir -p "$DEST"
cp -f "$SRC/"* "$DEST/"
echo "vendor-mediapipe: copied wasm → public/mediapipe/wasm/"
