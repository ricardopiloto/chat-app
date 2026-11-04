#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
master=docs/v2/parley_logo/parley-emblem-1024.png
icons=frontend/electron/icons
magick docs/v2/parley_logo/parley-logo-1024.png -strip -resize 256x256 frontend/src/assets/logo.png
magick "$master" -strip -resize 128x128 frontend/src/assets/emblem.png
magick "$master" -strip -resize 64x64 frontend/public/favicon.png
magick "$master" -strip -resize 180x180 frontend/public/apple-touch-icon.png
for size in 16 24 32 48 64 128 256 512; do
  magick "$master" -strip -resize "${size}x${size}" "PNG32:$icons/${size}x${size}.png"
done
cp "$master" "$icons/icon.png"
magick "$master" -strip -define icon:auto-resize=256,128,64,48,32,16 "$icons/icon.ico"
