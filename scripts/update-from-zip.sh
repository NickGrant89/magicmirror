#!/usr/bin/env bash
# Run on the Pi after scp'ing magic_mirror_for_mac.zip into ~
# Usage: bash ~/update-from-zip.sh
#    or: bash scripts/update-from-zip.sh  (from inside an existing magic-mirror)

set -euo pipefail

ZIP="${HOME}/magic_mirror_for_mac.zip"
APP="${HOME}/magic-mirror"
PORT=43127

if [[ ! -f "$ZIP" ]]; then
  echo "Missing $ZIP — download magic_mirror_for_mac.zip from Cursor agent Artifacts"
  echo "into ~/Downloads on the Mac, then:"
  echo "  scp ~/Downloads/magic_mirror_for_mac.zip nick@192.168.1.144:~/"
  exit 1
fi

echo "==> Stopping old mirror on :$PORT"
sudo fuser -k "${PORT}/tcp" 2>/dev/null || true
sudo pkill -9 -f "next start" 2>/dev/null || true
sudo pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 chromium 2>/dev/null || true
pkill -9 chromium-browser 2>/dev/null || true

echo "==> Cleaning home-dir junk from old installs"
rm -f "${HOME}/package.json" "${HOME}/package-lock.json"
rm -rf "${HOME}/node_modules" "${HOME}/.next"

echo "==> Replacing ${APP}"
rm -rf "$APP"
mkdir -p "$APP"
unzip -o "$ZIP" -d "$APP"
# zip may nest as magic_mirror_for_mac/… — flatten if needed
if [[ -d "${APP}/magic_mirror_for_mac" ]]; then
  shopt -s dotglob
  mv "${APP}/magic_mirror_for_mac"/* "$APP"/
  rmdir "${APP}/magic_mirror_for_mac"
  shopt -u dotglob
fi

cd "$APP"
echo "==> In $(pwd)"
test -f package.json
test -f src/components/mirror/mirror-board.tsx

echo "==> Version tag in UI source:"
grep -E "Pi ·" src/components/mirror/mirror-board.tsx || true

echo "==> npm install + build"
node -v
npm install
rm -rf .next
npm run build

echo "==> Starting on http://127.0.0.1:${PORT}"
echo "    Then open kiosk:"
echo "    DISPLAY=:0 chromium-browser --kiosk --new-window http://127.0.0.1:${PORT}"
exec npm start
