#!/usr/bin/env bash
# Converts the coffee mood-board images in docs/design-references/ into optimised
# WebP backgrounds (public/images/backgrounds/) plus tiny blur placeholders
# (src/generated/backgrounds.json). Requires macOS `sips` and `cwebp` (brew install webp).
# The typography reference is a style guide only and is never converted or shipped.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=docs/design-references
OUT=public/images/backgrounds
TMP=$(mktemp -d)
mkdir -p "$OUT" src/generated
trap 'rm -rf "$TMP"' EXIT

json="{"
first=1
for name in coffee-waves latte-swirl espresso-shot; do
  in="$SRC/ref-$name.jpg"
  # Never upscale: the originals are < 1600 px wide, so keep their native width.
  width=$(sips -g pixelWidth "$in" | awk '/pixelWidth/ {print $2}')
  target=$(( width < 1600 ? width : 1600 ))
  cwebp -quiet -q 78 -m 6 -resize "$target" 0 "$in" -o "$OUT/$name.webp"
  # 24 px wide, heavily compressed placeholder, inlined as a data URI.
  cwebp -quiet -q 30 -resize 24 0 "$in" -o "$TMP/$name.webp"
  b64=$(base64 < "$TMP/$name.webp" | tr -d '\n')
  h=$(sips -g pixelHeight "$in" | awk '/pixelHeight/ {print $2}')
  [ $first -eq 1 ] || json+=","
  first=0
  json+="\"$name\":{\"src\":\"/images/backgrounds/$name.webp\",\"width\":$target,\"height\":$(( h * target / width )),\"placeholder\":\"data:image/webp;base64,$b64\"}"
  printf '%-14s %6s KB\n' "$name" "$(( $(stat -f%z "$OUT/$name.webp") / 1024 ))"
done
json+="}"
echo "$json" > src/generated/backgrounds.json
