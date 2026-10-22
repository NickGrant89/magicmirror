#!/usr/bin/env bash
# One-shot Pi recovery: download latest GitHub zip and apply it.
# Safe even if your shell is stuck in a deleted ~/magic-mirror directory.
#
# Run (copy-paste):
#   curl -fsSL https://raw.githubusercontent.com/NickGrant89/magicmirror/main/scripts/pi/recover-from-github.sh | bash
#
# Or force-apply even if hash matches:
#   curl -fsSL https://raw.githubusercontent.com/NickGrant89/magicmirror/main/scripts/pi/recover-from-github.sh | MAGIC_MIRROR_FORCE=1 bash

set -euo pipefail

cd / >/dev/null 2>&1 || true
export HOME="${HOME:-/home/nick}"
cd "$HOME"

REPO="${MAGIC_MIRROR_GITHUB_REPO:-NickGrant89/magicmirror}"
ASSET="${MAGIC_MIRROR_GITHUB_ASSET:-magic_mirror_for_mac.zip}"
ZIP="${HOME}/magic_mirror_for_mac.zip"
APP="${HOME}/magic-mirror"
URL="https://github.com/${REPO}/releases/latest/download/${ASSET}"

echo "==> Downloading $URL"
curl -fsSL --connect-timeout 20 --max-time 180 -o "$ZIP" "$URL"
echo "    sha256: $(sha256sum "$ZIP" | awk '{print $1}')"

if [[ -x "${APP}/scripts/pi/apply-update.sh" ]]; then
  echo "==> Applying via existing apply-update.sh"
  MAGIC_MIRROR_FORCE="${MAGIC_MIRROR_FORCE:-1}" bash "${APP}/scripts/pi/apply-update.sh"
else
  echo "==> No apply-update.sh yet — unpacking bootstrap…"
  STAGE="$(mktemp -d /tmp/magic-mirror-recover.XXXXXX)"
  unzip -oq "$ZIP" -d "$STAGE"
  SRC="$STAGE"
  [[ -d "${STAGE}/magic_mirror_for_mac" ]] && SRC="${STAGE}/magic_mirror_for_mac"
  mkdir -p "${HOME}/.magic-mirror"
  if [[ -f "${APP}/.env.local" ]]; then
    cp -a "${APP}/.env.local" "${HOME}/.magic-mirror/env.local.bak"
  fi
  rm -rf "$APP"
  mkdir -p "$APP"
  shopt -s dotglob
  cp -a "${SRC}"/* "$APP"/
  shopt -u dotglob
  if [[ -f "${HOME}/.magic-mirror/env.local.bak" ]]; then
    cp -a "${HOME}/.magic-mirror/env.local.bak" "${APP}/.env.local"
  fi
  chmod +x "${APP}/scripts/pi/"*.sh 2>/dev/null || true
  MAGIC_MIRROR_FORCE=1 bash "${APP}/scripts/pi/apply-update.sh"
  rm -rf "$STAGE"
fi

echo "==> Enabling GitHub auto-update timer"
bash "${APP}/scripts/pi/install-autoupdate.sh" || true

echo ""
echo "Done. Badge should mention v16.8+ / weather."
echo "Logs: ~/.magic-mirror/update.log"
echo "Always run updates from:  cd / && cd ~"
