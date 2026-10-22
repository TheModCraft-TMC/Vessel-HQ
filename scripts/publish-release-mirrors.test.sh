#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/bin" "$fixture/auth"
printf '{}\n' > "$fixture/auth/config.json"
export DOCKER_CONFIG="$fixture/auth" MIRROR_LOG="$fixture/log" MIRROR_DIGEST="sha256:$(printf 'a%.0s' {1..64})"
cat > "$fixture/bin/docker" <<'MOCK'
#!/usr/bin/env bash
ref=$4
if [[ "$ref" == destination:* ]]; then
  case "$MIRROR_MODE" in
    conflict) printf 'sha256:conflict\n'; exit 0;;
    denied) echo 'unauthorized: access denied' >&2; exit 1;;
  esac
fi
if [[ "$*" == *'json .Manifest'* ]]; then
  printf '{"digest":"%s","manifests":[{"platform":{"os":"linux","architecture":"amd64"}},{"platform":{"os":"linux","architecture":"arm64"}}]}\n' "$MIRROR_DIGEST"
else
  echo "$MIRROR_DIGEST"
fi
MOCK
cat > "$fixture/bin/skopeo" <<'MOCK'
#!/usr/bin/env bash
if [[ "$1" == copy ]]; then
  echo "$*" >> "$MIRROR_LOG"
  [[ "$*" == *'--all --preserve-digests'* ]]
  [[ "$MIRROR_MODE" != copyfail ]] || exit 1
fi
MOCK
chmod +x "$fixture/bin/"*
export PATH="$fixture/bin:$PATH"
for MIRROR_MODE in conflict denied copyfail; do
  export MIRROR_MODE
  : > "$MIRROR_LOG"
  if bash "$root/scripts/publish-release-mirrors.sh" source 1.3.1-beta.1 "$MIRROR_DIGEST" destination > /dev/null 2>&1; then
    echo "Expected rejection for $MIRROR_MODE" >&2; exit 1
  fi
  ! grep -q 'destination:beta' "$MIRROR_LOG"
  if [[ "$MIRROR_MODE" != copyfail ]]; then [[ ! -s "$MIRROR_LOG" ]]; fi
done
export MIRROR_MODE=success
: > "$MIRROR_LOG"
bash "$root/scripts/publish-release-mirrors.sh" source 1.3.1-beta.1 "$MIRROR_DIGEST" destination second > /dev/null
(( $(wc -l < "$MIRROR_LOG") == 4 ))
[[ $(sed -n '1p' "$MIRROR_LOG") == *'destination:1.3.1-beta.1' ]]
[[ $(sed -n '2p' "$MIRROR_LOG") == *'second:1.3.1-beta.1' ]]
[[ $(sed -n '3p' "$MIRROR_LOG") == *'destination:beta' ]]
! grep -q ':latest' "$MIRROR_LOG"
echo 'Registry mirror failure and promotion tests passed'
