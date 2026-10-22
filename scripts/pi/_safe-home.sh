# shellcheck shell=bash
# Source this after set -euo pipefail. Fixes shells stuck in a deleted cwd
# (common after apply-update wiped ~/magic-mirror while you were still in it).
cd / >/dev/null 2>&1 || true
if [[ -n "${HOME:-}" && -d "$HOME" ]]; then
  cd "$HOME" || true
elif [[ -d /home/nick ]]; then
  export HOME=/home/nick
  cd "$HOME"
else
  echo "Cannot find home directory" >&2
  exit 1
fi
