#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/bin" "$fixture/auth" "$fixture/state"
printf '{}\n' > "$fixture/auth/config.json"
export DOCKER_CONFIG="$fixture/auth" REISSUE_STATE="$fixture/state" REISSUE_LOG="$fixture/log"
export OLD=sha256:da06e29cafd61278ff86ef4a25b600199e5e914f085066e848ab2eee64999014
export NEW="sha256:$(printf 'b%.0s' {1..64})"
cat > "$fixture/bin/docker" <<'MOCK'
#!/usr/bin/env bash
ref=$4
file="$REISSUE_STATE/${ref//\//_}"
if [[ ! -f "$file" ]]; then echo 'manifest unknown' >&2; exit 1; fi
digest=$(cat "$file")
if [[ "$*" == *'json .Manifest'* ]]; then
  printf '{"digest":"%s","manifests":[{"platform":{"os":"linux","architecture":"amd64"}},{"platform":{"os":"linux","architecture":"arm64"}}]}\n' "$digest"
else
  echo "$digest"
fi
MOCK
cat > "$fixture/bin/skopeo" <<'MOCK'
#!/usr/bin/env bash
set -eu
echo "$*" >> "$REISSUE_LOG"
[[ "$*" == *'--all --preserve-digests'* ]]
[[ "${COPY_FAIL:-}" != 1 ]] || exit 1
args=("$@")
source=${args[${#args[@]}-2]#docker://}
target=${args[${#args[@]}-1]#docker://}
echo "${source##*@}" > "$REISSUE_STATE/${target//\//_}"
MOCK
chmod +x "$fixture/bin/"*
export PATH="$fixture/bin:$PATH"
primary=docker.io/themodcrafttmc/vessel-hq
mirror=ghcr.io/themodcraft-tmc/vessel-hq
archive=1.3.2-before-sidebar-stats-fix
set_digest() { local ref=$1; echo "$2" > "$REISSUE_STATE/${ref//\//_}"; }
reject() {
  : > "$REISSUE_LOG"
  if bash "$root/scripts/reissue-ui-1.3.2.sh" "$@" >/dev/null 2>&1; then
    echo "Expected rejection: $*" >&2; exit 1
  fi
  [[ ! -s "$REISSUE_LOG" ]]
}
set_digest "$primary:1.3.2" "$OLD"
set_digest "$mirror:1.3.2" "$OLD"
reject archive 1.3.3 "$OLD"
reject archive 1.3.2 "$NEW"
set_digest "$mirror:1.3.2" "$NEW"
reject archive 1.3.2 "$OLD"
set_digest "$mirror:1.3.2" "$OLD"
set_digest "$mirror:$archive" "$NEW"
reject archive 1.3.2 "$OLD"
set_digest "$mirror:$archive" "$OLD"
bash "$root/scripts/reissue-ui-1.3.2.sh" archive 1.3.2 "$OLD"
(( $(wc -l < "$REISSUE_LOG") == 2 ))
set_digest "$primary:1.3.2" "$NEW"
set_digest "$mirror:$archive" "$NEW"
reject mirror 1.3.2 "$OLD" "$NEW"
set_digest "$mirror:$archive" "$OLD"
set_digest "$mirror:1.3.2" sha256:unexpected
reject mirror 1.3.2 "$OLD" "$NEW"
set_digest "$mirror:1.3.2" "$OLD"
if COPY_FAIL=1 bash "$root/scripts/reissue-ui-1.3.2.sh" mirror 1.3.2 "$OLD" "$NEW" >/dev/null 2>&1; then exit 1; fi
[[ $(cat "$REISSUE_STATE/${mirror//\//_}:1.3.2") == "$OLD" ]]
bash "$root/scripts/reissue-ui-1.3.2.sh" mirror 1.3.2 "$OLD" "$NEW"
[[ $(cat "$REISSUE_STATE/${mirror//\//_}:1.3.2") == "$NEW" ]]
! grep -q ':latest' "$REISSUE_LOG"
echo 'Scoped UI reissue archive and conflict tests passed'
