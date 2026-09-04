#!/usr/bin/env bash
# RSS of browser (spike client), token service, and LiveKit.
# Usage: measure-ram.sh idle|in_call
# Docker stats needs membership in group `docker` (or sudo).
set -euo pipefail
MODE="${1:-idle}"
echo "mode=${MODE} at=$(date -Iseconds)"

rss_mb() {
  local pid="$1"
  local rss
  rss="$(ps -o rss= -p "$pid" 2>/dev/null | tr -d ' ')"
  if [[ -z "$rss" ]]; then
    return 1
  fi
  awk -v k="$rss" 'BEGIN { printf "%.1f", k/1024 }'
}

echo "--- browser (cliente desta onda) ---"
found=0
mapfile -t BPIDS < <(pgrep -x 'zen|firefox|firefox-bin|chromium|chrome|msedge' || true)
for pid in "${BPIDS[@]}"; do
  args="$(ps -o args= -p "$pid" 2>/dev/null || true)"
  case "$args" in
    *"-contentproc"*|*" --type="*|*"--type="*) continue ;;
  esac
  mb="$(rss_mb "$pid" || true)"
  comm="$(ps -o comm= -p "$pid" 2>/dev/null | awk '{print $1}')"
  if [[ -n "${mb:-}" ]]; then
    found=1
    echo "pid=${pid} comm=${comm} rss_mb=${mb}"
  fi
done
if [[ "$found" -eq 0 ]]; then
  echo "no zen/firefox/chromium/msedge parent process — open the spike tab first"
else
  echo "note: RSS is the whole browser (all tabs), not an isolated spike window"
fi

echo "--- token-svc ---"
mapfile -t TPIDS < <(pgrep -x spike-token || pgrep -f '[t]arget/debug/spike-token' || true)
if [[ ${#TPIDS[@]} -eq 0 ]]; then
  echo "no spike-token process"
else
  for pid in "${TPIDS[@]}"; do
    mb="$(rss_mb "$pid" || true)"
    echo "pid=${pid} rss_mb=${mb}"
  done
fi

echo "--- livekit ---"
if docker stats --no-stream --format '{{.Name}}	{{.MemUsage}}' 2>/dev/null; then
  :
else
  echo "docker stats unavailable (not in group docker — relogin after usermod, or: sudo docker stats --no-stream)"
  mapfile -t LPIDS < <(pgrep -x livekit-server || true)
  if [[ ${#LPIDS[@]} -eq 0 ]]; then
    echo "no livekit-server process visible on host"
  else
    echo "fallback: host-visible livekit-server RSS"
    for pid in "${LPIDS[@]}"; do
      mb="$(rss_mb "$pid" || true)"
      echo "pid=${pid} comm=livekit-server rss_mb=${mb}"
    done
  fi
fi
