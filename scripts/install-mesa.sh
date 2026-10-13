#!/bin/sh
set -eu

API='https://api.github.com/repos/ricardopiloto/chat-app/releases/latest'
for command in curl python3; do
  command -v "$command" >/dev/null 2>&1 || { echo "Mesa: precisa de $command." >&2; exit 1; }
done

system=$(uname -s)
machine=$(uname -m)
case "$system:$machine" in
  Linux:x86_64|Linux:amd64) format=AppImage; architecture=x86_64 ;;
  Darwin:x86_64) format=dmg; architecture=x64 ;;
  Darwin:arm64) format=dmg; architecture=arm64 ;;
  *) echo "Mesa: sistema ou arquitetura não suportados: $system/$machine" >&2; exit 1 ;;
esac

temporary=$(mktemp -d)
mounted=0
staged=
cleanup() {
  if [ "$mounted" -eq 1 ]; then hdiutil detach "$temporary/mount" -quiet || true; fi
  if [ -n "$staged" ]; then rm -f "$staged"; fi
  rm -rf "$temporary"
}
trap cleanup 0
trap 'exit 1' 1 2 3 15

curl -fsSL --retry 2 --connect-timeout 10 "$API" -o "$temporary/release.json"
python3 - "$temporary/release.json" "$format" "$architecture" > "$temporary/selection" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as source:
    release = json.load(source)
if release.get("draft") or release.get("prerelease"):
    raise SystemExit("Mesa: a última release não está publicada.")
format, architecture = sys.argv[2:]
assets = release.get("assets", [])
checksums = [asset for asset in assets if asset.get("name") == "SHA256SUMS"]
if len(checksums) != 1:
    raise SystemExit("Mesa: a release não contém SHA256SUMS.")
candidates = [
    asset for asset in assets
    if asset.get("name", "").endswith("." + format)
    and architecture.lower() in asset.get("name", "").lower()
]
if len(candidates) != 1:
    raise SystemExit(f"Mesa: esperado um instalador {format} para {architecture}; encontrados {len(candidates)}.")
for asset in (candidates[0], checksums[0]):
    url = asset.get("browser_download_url", "")
    if not url.startswith("https://github.com/ricardopiloto/chat-app/releases/download/"):
        raise SystemExit("Mesa: URL inesperada na release.")
    print(asset["name"])
    print(url)
PY

asset_name=$(sed -n '1p' "$temporary/selection")
asset_url=$(sed -n '2p' "$temporary/selection")
hash_url=$(sed -n '4p' "$temporary/selection")
curl -fsSL --retry 2 "$asset_url" -o "$temporary/$asset_name"
curl -fsSL --retry 2 "$hash_url" -o "$temporary/SHA256SUMS"
expected=$(awk -v name="$asset_name" '$2 == name { print $1 }' "$temporary/SHA256SUMS")
case "$expected" in
  *[!0-9a-fA-F]*|'') echo "Mesa: hash SHA-256 ausente ou inválido para $asset_name." >&2; exit 1 ;;
esac
[ "${#expected}" -eq 64 ] || { echo "Mesa: hash SHA-256 inválido." >&2; exit 1; }
if command -v sha256sum >/dev/null 2>&1; then
  actual=$(sha256sum "$temporary/$asset_name" | awk '{print $1}')
else
  actual=$(shasum -a 256 "$temporary/$asset_name" | awk '{print $1}')
fi
[ "$actual" = "$expected" ] || { echo "Mesa: SHA-256 não confere; instalação interrompida." >&2; exit 1; }

if [ "$system" = Linux ]; then
  mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications" "$HOME/.local/share/icons"
  target="$HOME/.local/bin/mesa-chat-app.AppImage"
  staged="$HOME/.local/bin/.mesa-chat-app-$$.AppImage"
  cp "$temporary/$asset_name" "$staged"
  chmod 755 "$staged"
  (cd "$temporary" && "$staged" --appimage-extract >/dev/null)
  # The AppImage spec guarantees a top-level icon next to the .desktop file; electron-builder's
  # hicolor sizes vary by app (this one only ships 32/64/128), so that top-level file is the
  # reliable pick instead of guessing a specific hicolor size.
  icon=$(find "$temporary/squashfs-root" -maxdepth 1 -type f -name '*.png' | head -n 1 || true)
  [ -n "$icon" ] || icon=$(find "$temporary/squashfs-root/usr/share/icons" -type f -name '*.png' 2>/dev/null | head -n 1 || true)
  [ -n "$icon" ] || { echo "Mesa: ícone não encontrado no AppImage." >&2; exit 1; }
  cp "$icon" "$HOME/.local/share/icons/mesa-chat-app.png"
  mv -f "$staged" "$target"
  printf '[Desktop Entry]\nType=Application\nName=Mesa\nExec=%s\nIcon=%s\nCategories=Network;Chat;\nTerminal=false\n' "$target" "$HOME/.local/share/icons/mesa-chat-app.png" > "$HOME/.local/share/applications/mesa.desktop"
  echo "Mesa instalada em $target. Abra pelo menu de aplicações."
else
  mkdir -p "$temporary/mount"
  hdiutil attach "$temporary/$asset_name" -nobrowse -readonly -mountpoint "$temporary/mount" -quiet
  mounted=1
  app=$(find "$temporary/mount" -maxdepth 1 -type d -name '*.app' | head -n 1)
  [ -n "$app" ] || { echo "Mesa: aplicação não encontrada no DMG." >&2; exit 1; }
  if [ -w /Applications ]; then
    ditto "$app" "/Applications/$(basename "$app")"
  else
    sudo ditto "$app" "/Applications/$(basename "$app")"
  fi
  echo "Mesa instalada em /Applications."
fi
