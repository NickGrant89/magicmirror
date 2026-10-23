#!/usr/bin/env bash
# Wait until the Next.js mirror answers on :43127 before opening Chromium.
set -euo pipefail

URL="${MAGIC_MIRROR_URL:-http://127.0.0.1:43127/}"
deadline=$((SECONDS + 180))

while (( SECONDS < deadline )); do
  if curl -fsS --connect-timeout 2 --max-time 3 -o /dev/null "$URL" 2>/dev/null; then
    exit 0
  fi
  sleep 2
done

echo "wait-for-mirror: timed out waiting for $URL" >&2
exit 1
