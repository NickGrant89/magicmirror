#!/usr/bin/env bash
# Apply ~/magic_mirror_for_mac.zip into ~/magic-mirror, keep .env.local, rebuild.
# Intended to be run by systemd (magic-mirror-update.service).

set -euo pipefail

# Never stay inside ~/magic-mirror — this script deletes and rebuilds that folder.
cd "$HOME" || exit 1

ZIP="${HOME}/magic_mirror_for_mac.zip"
APP="${HOME}/magic-mirror"
PORT=43127
STAMP_DIR="${HOME}/.magic-mirror"
STAMP_FILE="${STAMP_DIR}/last-zip.sha256"
ENV_BACKUP="${STAMP_DIR}/env.local.bak"
LOG="${STAMP_DIR}/update.log"

mkdir -p "$STAMP_DIR"
exec >>"$LOG" 2>&1
echo "======== $(date -Is) apply-update ========"

if [[ ! -f "$ZIP" ]]; then
  echo "No zip at $ZIP — nothing to do"
  exit 0
fi

NEW_HASH="$(sha256sum "$ZIP" | awk '{print $1}')"
OLD_HASH=""
[[ -f "$STAMP_FILE" ]] && OLD_HASH="$(cat "$STAMP_FILE")"

if [[ "$NEW_HASH" == "$OLD_HASH" && -d "$APP/.next" ]]; then
  echo "Zip unchanged ($NEW_HASH) and build exists — skip"
  exit 0
fi

echo "New/changed zip: $NEW_HASH (was ${OLD_HASH:-none})"

# Wait for scp to finish writing the zip
for _ in 1 2 3 4 5 6; do
  sleep 2
  NOW="$(sha256sum "$ZIP" | awk '{print $1}')"
  SIZE1="$(stat -c%s "$ZIP" 2>/dev/null || echo 0)"
  sleep 1
  SIZE2="$(stat -c%s "$ZIP" 2>/dev/null || echo 0)"
  if [[ "$SIZE1" == "$SIZE2" && "$SIZE1" != "0" ]]; then
    NEW_HASH="$NOW"
    break
  fi
  echo "Zip still growing — waiting…"
done

# Preserve secrets across wipe
if [[ -f "${APP}/.env.local" ]]; then
  cp -a "${APP}/.env.local" "$ENV_BACKUP"
  echo "Backed up .env.local"
fi

# Stop app (kiosk stays up briefly; will restart after)
systemctl --user stop magic-mirror.service 2>/dev/null || true
sudo fuser -k "${PORT}/tcp" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true

rm -f "${HOME}/package.json" "${HOME}/package-lock.json"
rm -rf "${HOME}/node_modules" "${HOME}/.next"

STAGE="$(mktemp -d /tmp/magic-mirror-stage.XXXXXX)"
cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

unzip -oq "$ZIP" -d "$STAGE"
SRC="$STAGE"
if [[ -d "${STAGE}/magic_mirror_for_mac" ]]; then
  SRC="${STAGE}/magic_mirror_for_mac"
fi

test -f "${SRC}/package.json"
test -f "${SRC}/src/components/mirror/mirror-board.tsx"

# Strip any leftover Alexa lights files if an old zip sneaks in
rm -rf "${SRC}/src/app/api/lights" \
  "${SRC}/src/lib/lights.ts" \
  "${SRC}/src/components/mirror/lights-panel.tsx"

rm -rf "$APP"
mkdir -p "$APP"
# copy contents (including hidden like .env.example)
shopt -s dotglob
cp -a "${SRC}"/* "$APP"/
shopt -u dotglob

if [[ -f "$ENV_BACKUP" ]]; then
  cp -a "$ENV_BACKUP" "${APP}/.env.local"
  echo "Restored .env.local"
fi

cd "$APP"
echo "Version tag:"
grep -E "Pi ·" src/components/mirror/mirror-board.tsx || true

echo "npm install…"
npm install --no-fund --no-audit
echo "npm run build…"
rm -rf .next
npm run build

echo "$NEW_HASH" >"$STAMP_FILE"

# Refresh systemd units from this release
UNIT_DIR="${HOME}/.config/systemd/user"
mkdir -p "$UNIT_DIR"
cp -f "${APP}/scripts/pi/magic-mirror.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-kiosk.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-update.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-update.path" "$UNIT_DIR/"
chmod +x "${APP}/scripts/pi/apply-update.sh"
systemctl --user daemon-reload

echo "Build OK — restarting services"
systemctl --user restart magic-mirror.service
sleep 3
systemctl --user restart magic-mirror-kiosk.service || true
echo "Done $(date -Is)"
