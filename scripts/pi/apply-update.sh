#!/usr/bin/env bash
# Apply ~/magic_mirror_for_mac.zip into ~/magic-mirror, keep .env.local, rebuild.
# Intended to be run by systemd (magic-mirror-update.service).
#
# Uses an exclusive lock so recover + path-unit + fetch never wipe .next mid-build.

set -euo pipefail

# Escape deleted cwd (shell stuck inside wiped ~/magic-mirror), then go home.
cd / >/dev/null 2>&1 || true
export HOME="${HOME:-/home/nick}"
cd "$HOME"

ZIP="${HOME}/magic_mirror_for_mac.zip"
APP="${HOME}/magic-mirror"
PORT=43127
STAMP_DIR="${HOME}/.magic-mirror"
STAMP_FILE="${STAMP_DIR}/last-zip.sha256"
ENV_BACKUP="${STAMP_DIR}/env.local.bak"
LOG="${STAMP_DIR}/update.log"
LOCK="${STAMP_DIR}/apply.lock"

mkdir -p "$STAMP_DIR"

# Exclusive lock — if another apply is running, wait (or exit if WAIT=0).
exec 9>"$LOCK"
if ! flock -n 9; then
  if [[ "${MAGIC_MIRROR_LOCK_WAIT:-1}" == "1" ]]; then
    echo "Another apply-update is running — waiting for lock…" | tee -a "$LOG"
    flock 9
  else
    echo "Another apply-update is running — skip" | tee -a "$LOG"
    exit 0
  fi
fi

# Show progress in the terminal when run by hand; always keep a log.
if [[ -t 1 ]]; then
  exec > >(tee -a "$LOG") 2>&1
else
  exec >>"$LOG" 2>&1
fi
echo "======== $(date -Is) apply-update ========"

if [[ ! -f "$ZIP" ]]; then
  echo "No zip at $ZIP — nothing to do"
  exit 0
fi

NEW_HASH="$(sha256sum "$ZIP" | awk '{print $1}')"
OLD_HASH=""
[[ -f "$STAMP_FILE" ]] && OLD_HASH="$(cat "$STAMP_FILE")"

# MAGIC_MIRROR_FORCE=1 rebuilds even if the zip hash matches.
if [[ "${MAGIC_MIRROR_FORCE:-0}" != "1" && "$NEW_HASH" == "$OLD_HASH" && -d "$APP/.next" ]]; then
  echo "Zip unchanged ($NEW_HASH) and build exists — skip"
  echo "Force with: MAGIC_MIRROR_FORCE=1 bash ~/magic-mirror/scripts/pi/apply-update.sh"
  exit 0
fi

echo "New/changed zip: $NEW_HASH (was ${OLD_HASH:-none})"

# Wait for scp / curl to finish writing the zip
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

# Build in a staging dir first — never delete APP until the new build is ready.
# This avoids Turbopack ENOENT when a second update wipes .next mid-build.
STAGE="$(mktemp -d /tmp/magic-mirror-stage.XXXXXX)"
BUILD="$(mktemp -d /tmp/magic-mirror-build.XXXXXX)"
cleanup() { rm -rf "$STAGE" "$BUILD"; }
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

shopt -s dotglob
cp -a "${SRC}"/* "$BUILD"/
shopt -u dotglob

if [[ -f "$ENV_BACKUP" ]]; then
  cp -a "$ENV_BACKUP" "${BUILD}/.env.local"
  echo "Restored .env.local into build tree"
fi

cd "$BUILD"
echo "Version tag:"
grep -E "Pi ·" src/components/mirror/mirror-board.tsx || true

echo "npm install…"
npm install --no-fund --no-audit

echo "npm run build…"
rm -rf .next
mkdir -p .next/cache
# Prefer a stable cache dir on disk; avoid racing with a live APP/.next
export NEXT_CACHE_DIR="${BUILD}/.next/cache"
npm run build

test -f "${BUILD}/.next/BUILD_ID" || test -d "${BUILD}/.next/server" || {
  echo "Build looks incomplete — aborting swap"
  exit 1
}

# Stop the running app only after the new build succeeded
systemctl --user stop magic-mirror.service 2>/dev/null || true
sudo fuser -k "${PORT}/tcp" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true

rm -f "${HOME}/package.json" "${HOME}/package-lock.json"
rm -rf "${HOME}/node_modules" "${HOME}/.next"

# Atomic-ish swap: move old aside, move new in
OLD="${APP}.prev.$$"
rm -rf "$OLD"
if [[ -d "$APP" ]]; then
  mv "$APP" "$OLD"
fi
mv "$BUILD" "$APP"
# BUILD var now points at moved tree; don't delete APP in cleanup
BUILD=""
rm -rf "$OLD"

cd "$APP"
echo "$NEW_HASH" >"$STAMP_FILE"

# Refresh systemd units from this release
UNIT_DIR="${HOME}/.config/systemd/user"
mkdir -p "$UNIT_DIR"
cp -f "${APP}/scripts/pi/magic-mirror.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-kiosk.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-update.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-update.path" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-github-fetch.service" "$UNIT_DIR/" 2>/dev/null || true
cp -f "${APP}/scripts/pi/magic-mirror-github-fetch.timer" "$UNIT_DIR/" 2>/dev/null || true
chmod +x \
  "${APP}/scripts/pi/apply-update.sh" \
  "${APP}/scripts/pi/fetch-github-release.sh" \
  "${APP}/scripts/pi/recover-from-github.sh" \
  "${APP}/scripts/pi/install-autoupdate.sh" \
  "${APP}/scripts/pi/wait-for-display.sh" \
  "${APP}/scripts/pi/wait-for-mirror.sh" 2>/dev/null || true

# Keep linger + boot enables healthy after every release apply
if command -v loginctl >/dev/null 2>&1; then
  if ! loginctl show-user "$USER" -p Linger 2>/dev/null | grep -q 'Linger=yes'; then
    sudo loginctl enable-linger "$USER" 2>/dev/null || true
  fi
fi

systemctl --user daemon-reload
systemctl --user enable magic-mirror.service 2>/dev/null || true
systemctl --user enable magic-mirror-kiosk.service 2>/dev/null || true
systemctl --user enable --now magic-mirror-update.path 2>/dev/null || true
systemctl --user enable magic-mirror-github-fetch.timer 2>/dev/null || true
systemctl --user restart magic-mirror-github-fetch.timer 2>/dev/null || \
  systemctl --user start magic-mirror-github-fetch.timer 2>/dev/null || true

echo "Build OK — restarting services"
systemctl --user restart magic-mirror.service
sleep 3
systemctl --user restart magic-mirror-kiosk.service || true
echo "Done $(date -Is)"
echo "Tip: run updates from  cd / && cd ~  (not from inside magic-mirror)"
