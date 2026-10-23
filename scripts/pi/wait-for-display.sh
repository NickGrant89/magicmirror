#!/usr/bin/env bash
# Wait until a graphical session is usable after reboot (linger user units
# often start before :0 / Wayland is ready).
set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"
export HOME="${HOME:-/home/nick}"
uid="$(id -u)"

if [[ -z "${XAUTHORITY:-}" || ! -f "${XAUTHORITY}" ]]; then
  if [[ -f "${HOME}/.Xauthority" ]]; then
    export XAUTHORITY="${HOME}/.Xauthority"
  elif [[ -f "/run/user/${uid}/gdm/Xauthority" ]]; then
    export XAUTHORITY="/run/user/${uid}/gdm/Xauthority"
  else
    shopt -s nullglob
    for f in "/run/user/${uid}/.mutter-Xwaylandauth."*; do
      export XAUTHORITY="$f"
      break
    done
    shopt -u nullglob
  fi
fi
export XAUTHORITY="${XAUTHORITY:-${HOME}/.Xauthority}"

deadline=$((SECONDS + 120))
while (( SECONDS < deadline )); do
  if [[ -S /tmp/.X11-unix/X0 || -S /tmp/.X11-unix/X1 ]]; then
    if command -v xdpyinfo >/dev/null 2>&1; then
      if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
        exit 0
      fi
    else
      # Socket exists; Chromium can often attach even without xdpyinfo
      exit 0
    fi
  fi

  runtime="${XDG_RUNTIME_DIR:-/run/user/${uid}}"
  shopt -s nullglob
  wayland=( "${runtime}"/wayland-* )
  shopt -u nullglob
  if (( ${#wayland[@]} > 0 )); then
    exit 0
  fi

  sleep 2
done

echo "wait-for-display: timed out waiting for DISPLAY=${DISPLAY}" >&2
exit 1
