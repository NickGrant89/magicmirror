#!/usr/bin/env bash
# One-time Pi setup: systemd user services for app, kiosk, and zip auto-update.
# Run from inside ~/magic-mirror after first install:
#   bash scripts/pi/install-autoupdate.sh

set -euo pipefail

cd "$HOME" || exit 1

APP="${HOME}/magic-mirror"
UNIT_DIR="${HOME}/.config/systemd/user"

if [[ ! -d "$APP" ]]; then
  echo "Expected app at $APP — unpack the zip first."
  exit 1
fi

chmod +x "${APP}/scripts/pi/apply-update.sh" "${APP}/scripts/pi/install-autoupdate.sh"

mkdir -p "$UNIT_DIR"
cp -f "${APP}/scripts/pi/magic-mirror.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-kiosk.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-update.service" "$UNIT_DIR/"
cp -f "${APP}/scripts/pi/magic-mirror-update.path" "$UNIT_DIR/"

# Allow user services without an active login (Pi boot)
if command -v loginctl >/dev/null 2>&1; then
  sudo loginctl enable-linger "$USER" || true
fi

systemctl --user daemon-reload
systemctl --user enable --now magic-mirror.service
systemctl --user enable --now magic-mirror-kiosk.service
systemctl --user enable --now magic-mirror-update.path

# Seed stamp so the current zip is not reapplied immediately
mkdir -p "${HOME}/.magic-mirror"
if [[ -f "${HOME}/magic_mirror_for_mac.zip" ]]; then
  sha256sum "${HOME}/magic_mirror_for_mac.zip" | awk '{print $1}' \
    >"${HOME}/.magic-mirror/last-zip.sha256"
fi

echo ""
echo "Auto-update installed."
echo "  App:    systemctl --user status magic-mirror"
echo "  Kiosk:  systemctl --user status magic-mirror-kiosk"
echo "  Watch:  systemctl --user status magic-mirror-update.path"
echo ""
echo "From now on:"
echo "  1) Download magic_mirror_for_mac.zip from the Cursor agent Artifacts"
echo "     (https://cursor.com/agents/bc-86e9ef9c-f832-56ef-b654-c4094f1ea8ca)"
echo "     into ~/Downloads — do NOT use AgentStores paths."
echo "  2) Mac:  shasum -a 256 ~/Downloads/magic_mirror_for_mac.zip"
echo "           scp ~/Downloads/magic_mirror_for_mac.zip nick@192.168.1.144:~/"
echo "  3) Pi:   sha256sum ~/magic_mirror_for_mac.zip"
echo "           (auto-update runs when the hash changes; FORCE if needed)"
echo "Logs: ~/.magic-mirror/update.log"
