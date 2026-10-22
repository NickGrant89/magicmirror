#!/usr/bin/env bash
# Pull latest magic_mirror_for_mac.zip from GitHub Releases into ~/
# Safe to run from a systemd timer; apply-update path unit picks up changes.
#
# Config (optional):
#   MAGIC_MIRROR_GITHUB_REPO=NickGrant89/magicmirror
#   MAGIC_MIRROR_GITHUB_ASSET=magic_mirror_for_mac.zip

set -euo pipefail

cd "$HOME" || exit 1

REPO="${MAGIC_MIRROR_GITHUB_REPO:-NickGrant89/magicmirror}"
ASSET="${MAGIC_MIRROR_GITHUB_ASSET:-magic_mirror_for_mac.zip}"
ZIP="${HOME}/magic_mirror_for_mac.zip"
STAMP_DIR="${HOME}/.magic-mirror"
LOG="${STAMP_DIR}/fetch.log"
TMP="$(mktemp "${HOME}/.magic-mirror-download.XXXXXX.zip")"

mkdir -p "$STAMP_DIR"
exec >>"$LOG" 2>&1
echo "======== $(date -Is) fetch-github-release ========"

URL="https://github.com/${REPO}/releases/latest/download/${ASSET}"
echo "GET $URL"

if ! curl -fsSL --connect-timeout 20 --max-time 180 -o "$TMP" "$URL"; then
  echo "Download failed"
  rm -f "$TMP"
  exit 1
fi

NEW_HASH="$(sha256sum "$TMP" | awk '{print $1}')"
OLD_HASH=""
[[ -f "$ZIP" ]] && OLD_HASH="$(sha256sum "$ZIP" | awk '{print $1}')"

if [[ "$NEW_HASH" == "$OLD_HASH" ]]; then
  echo "Already up to date ($NEW_HASH)"
  rm -f "$TMP"
  exit 0
fi

mv -f "$TMP" "$ZIP"
echo "Updated $ZIP → $NEW_HASH (was ${OLD_HASH:-none})"
# Path unit should fire; nudge apply-update if it doesn't.
if [[ -x "${HOME}/magic-mirror/scripts/pi/apply-update.sh" ]]; then
  # Small delay so PathModified settles
  sleep 2
  bash "${HOME}/magic-mirror/scripts/pi/apply-update.sh" || true
fi
