#!/usr/bin/env bash
# One-time Pi setup: systemd user services for app, kiosk, zip watcher,
# and GitHub Releases poller — all enabled so they survive reboot.
# Run from anywhere after first install:
#   bash ~/magic-mirror/scripts/pi/install-autoupdate.sh

set -euo pipefail

cd / >/dev/null 2>&1 || true
export HOME="${HOME:-/home/nick}"
cd "$HOME" || exit 1

APP="${HOME}/magic-mirror"
UNIT_DIR="${HOME}/.config/systemd/user"

if [[ ! -d "$APP" ]]; then
  echo "Expected app at $APP — unpack the zip first."
  exit 1
fi

chmod +x \
  "${APP}/scripts/pi/apply-update.sh" \
  "${APP}/scripts/pi/install-autoupdate.sh" \
  "${APP}/scripts/pi/fetch-github-release.sh" \
  "${APP}/scripts/pi/recover-from-github.sh" \
  "${APP}/scripts/pi/wait-for-display.sh" \
  "${APP}/scripts/pi/wait-for-mirror.sh" \
  "${APP}/scripts/pi/bootstrap.sh" \
  "${APP}/scripts/update-from-zip.sh" \
  "${APP}/scripts/publish-github-release.sh" 2>/dev/null || true

mkdir -p "$UNIT_DIR"
cp -f "${APP}/scripts/pi/magic-mirror.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-kiosk.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-update.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-update.path" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-github-fetch.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-github-fetch.timer" "$UNIT_DIR/"

# User systemd must run at boot without an interactive login
if command -v loginctl >/dev/null 2>&1; then
  if ! loginctl show-user "$USER" -p Linger 2>/dev/null | grep -q 'Linger=yes'; then
    echo "Enabling linger for $USER (sudo)…"
    sudo loginctl enable-linger "$USER"
  fi
  loginctl show-user "$USER" -p Linger 2>/dev/null || true
fi

systemctl --user daemon-reload
systemctl --user enable --now magic-mirror.service
systemctl --user enable --now magic-mirror-kiosk.service
systemctl --user enable --now magic-mirror-update.path
systemctl --user enable --now magic-mirror-github-fetch.timer

# Seed stamp so the current zip is not reapplied immediately
mkdir -p "${HOME}/.magic-mirror"
if [[ -f "${HOME}/magic_mirror_for_mac.zip" ]]; then
  sha256sum "${HOME}/magic_mirror_for_mac.zip" | awk '{print $1}' \
    >"${HOME}/.magic-mirror/last-zip.sha256"
fi

echo ""
echo "Boot autostart installed (survives reboot)."
echo "  Linger:  loginctl show-user $USER -p Linger"
echo "  App:     systemctl --user is-enabled magic-mirror.service"
echo "  Kiosk:   systemctl --user is-enabled magic-mirror-kiosk.service"
echo "  Zip:     systemctl --user is-enabled magic-mirror-update.path"
echo "  GitHub:  systemctl --user is-enabled magic-mirror-github-fetch.timer"
systemctl --user is-enabled magic-mirror.service magic-mirror-kiosk.service \
  magic-mirror-update.path magic-mirror-github-fetch.timer 2>/dev/null || true
echo ""
echo "GitHub repo: NickGrant89/magicmirror"
echo "Every ~2 min the Pi curls (poll — not a webhook; home Pi has no public URL):"
echo "  https://github.com/NickGrant89/magicmirror/releases/latest/download/magic_mirror_for_mac.zip"
echo "apply-update uses ~/.magic-mirror/apply.lock so overlapping polls cannot corrupt builds."
echo "Manual pull now:"
echo "  cd / && bash ~/magic-mirror/scripts/pi/fetch-github-release.sh"
echo "Test reboot: sudo reboot   — mirror + kiosk should come back on their own."
echo "Logs: ~/.magic-mirror/update.log  and  ~/.magic-mirror/fetch.log"
