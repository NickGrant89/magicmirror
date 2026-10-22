#!/usr/bin/env bash
# Publish magic_mirror_for_mac.zip as a GitHub Release.
# Run from a machine with gh auth (Mac) or GH_TOKEN set.
#
# Usage:
#   bash scripts/publish-github-release.sh [tag]
# Example:
#   bash scripts/publish-github-release.sh v16.3.1

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPO="${MAGIC_MIRROR_GITHUB_REPO:-NickGrant89/magicmirror}"
TAG="${1:-}"
if [[ -z "$TAG" ]]; then
  TAG="$(grep -E 'Pi ·' src/components/mirror/mirror-board.tsx | head -1 | sed -E 's/.*(v[0-9][^\" ]*).*/\1/' | tr ' ' '-' || true)"
  TAG="${TAG:-v$(date +%Y%m%d%H%M)}"
fi

ZIP_OUT="$(mktemp -d)/magic_mirror_for_mac.zip"
STAGE="$(mktemp -d)/magic_mirror_for_mac"
mkdir -p "$STAGE"
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=tsconfig.tsbuildinfo --exclude=.env.local \
  -cf - -C "$ROOT" . | tar -xf - -C "$STAGE"
(
  cd "$(dirname "$STAGE")"
  zip -rq "$ZIP_OUT" "$(basename "$STAGE")" -x '*.DS_Store'
)

HASH="$(sha256sum "$ZIP_OUT" | awk '{print $1}')"
echo "Zip: $ZIP_OUT"
echo "sha256: $HASH"
echo "tag: $TAG"
echo "repo: $REPO"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI required. Install: https://cli.github.com/"
  exit 1
fi

gh release create "$TAG" "$ZIP_OUT" \
  --repo "$REPO" \
  --title "Magic Mirror $TAG" \
  --notes "Auto update zip. sha256: \`${HASH}\`

Pi will pick this up via \`fetch-github-release.sh\` (timer) or:
\`\`\`bash
curl -fsSL -o ~/magic_mirror_for_mac.zip \\
  https://github.com/${REPO}/releases/latest/download/magic_mirror_for_mac.zip
MAGIC_MIRROR_FORCE=1 bash ~/magic-mirror/scripts/pi/apply-update.sh
\`\`\`" \
  --latest

echo "Published https://github.com/${REPO}/releases/tag/${TAG}"
