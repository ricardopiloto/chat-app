#!/usr/bin/env bash
# Onda 1: print a JWT for alice|bob. Secret stays on the host, not in the client bundle.
set -euo pipefail
ROOT="$(CDPATH="" cd "$(dirname "$0")/../.." && pwd)"
IDENTITY="${1:-alice}"
ROOM="${2:-spike-room}"
exec node "$ROOT/spike/scripts/mint-dev-token.mjs" "$IDENTITY" "$ROOM"
