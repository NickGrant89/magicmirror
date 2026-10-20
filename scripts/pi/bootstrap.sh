#!/usr/bin/env bash
# Clean first-time / recovery unpack from ~/magic_mirror_for_mac.zip
# Usage: bash bootstrap.sh   (run from anywhere; uses $HOME)

set -euo pipefail
cd "$HOME" || exit 1

ZIP="${HOME}/magic_mirror_for_mac.zip"
APP="${HOME}/magic-mirror"

if [[ ! -f "$ZIP" ]]; then
  echo "Missing $ZIP — scp the zip to your Pi home first."
  exit 1
fi

STAGE="$(mktemp -d /tmp/mm-bootstrap.XXXXXX)"
trap 'rm -rf "$STAGE"' EXIT

echo "==> Unpacking $ZIP"
unzip -oq "$ZIP" -d "$STAGE"

SRC="$STAGE"
if [[ -f "${STAGE}/magic_mirror_for_mac/package.json" ]]; then
  SRC="${STAGE}/magic_mirror_for_mac"
elif [[ -f "${STAGE}/package.json" ]]; then
  SRC="$STAGE"
else
  echo "Could not find package.json inside zip"
  find "$STAGE" -maxdepth 3 -type f | head
  exit 1
fi

echo "==> Installing into $APP"
rm -rf "$APP"
mkdir -p "$APP"
shopt -s dotglob
cp -a "${SRC}"/* "$APP"/
shopt -u dotglob

chmod +x "$APP"/scripts/pi/*.sh "$APP"/scripts/*.sh 2>/dev/null || true

echo "==> Ready. Next:"
echo "  1) Create $APP/.env.local (Apple + album settings)"
echo "  2) MAGIC_MIRROR_FORCE=1 bash $APP/scripts/pi/apply-update.sh"
echo "  3) Optional: bash $APP/scripts/pi/install-autoupdate.sh"
grep -E "Pi ·" "$APP/src/components/mirror/mirror-board.tsx" || true
