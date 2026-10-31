#!/usr/bin/env bash
# One authorized same-tag UI repair. Normal releases remain immutable.
set -euo pipefail
action=${1:?action required}
version=${2:?version required}
previous=${3:?previous index digest required}
original=sha256:da06e29cafd61278ff86ef4a25b600199e5e914f085066e848ab2eee64999014
[[ "$version" == 1.3.2 && "$previous" == "$original" ]] || {
  echo 'Only the original 1.3.2 UI build can be reissued' >&2; exit 1;
}
primary=docker.io/themodcrafttmc/vessel-hq
mirror=ghcr.io/themodcraft-tmc/vessel-hq
archive=1.3.2-before-sidebar-stats-fix
authfile=${DOCKER_CONFIG:-$HOME/.docker}/config.json
[[ -f "$authfile" ]]
lookup_error=$(mktemp)
trap 'rm -f "$lookup_error"' EXIT
digest_of() {
  docker buildx imagetools inspect "$1" --format '{{.Manifest.Digest}}'
}
verify() {
  local ref=$1 digest=$2 manifest
  manifest=$(docker buildx imagetools inspect "$ref" --format '{{json .Manifest}}')
  jq -e --arg digest "$digest" '.digest == $digest and ([.manifests[].platform | .os + "/" + .architecture] | index("linux/amd64") != null and index("linux/arm64") != null)' <<< "$manifest" >/dev/null
}
copy() {
  skopeo copy --all --preserve-digests --retry-times 3 --authfile "$authfile" "docker://$1" "docker://$2"
}
case "$action" in
  archive)
    # Check both registries and all backup destinations before writing anything.
    for target in "$primary" "$mirror"; do
      verify "$target:$version" "$original"
      if existing=$(digest_of "$target:$archive" 2>"$lookup_error"); then
        [[ "$existing" == "$original" ]] || { echo 'Conflicting archive' >&2; exit 1; }
      elif ! grep -Eiq 'manifest unknown|not found|404' "$lookup_error"; then
        cat "$lookup_error" >&2; exit 1
      fi
    done
    for target in "$primary" "$mirror"; do
      copy "$target@$original" "$target:$archive"
      verify "$target:$archive" "$original"
    done
    ;;
  mirror)
    replacement=${4:?replacement index digest required}
    [[ "$replacement" =~ ^sha256:[a-f0-9]{64}$ && "$replacement" != "$original" ]]
    for target in "$primary" "$mirror"; do
      verify "$target:$archive" "$original"
    done
    verify "$primary:$version" "$replacement"
    current=$(digest_of "$mirror:$version")
    [[ "$current" == "$original" || "$current" == "$replacement" ]] || {
      echo 'Refusing to overwrite an unexpected mirror' >&2; exit 1;
    }
    copy "$primary@$replacement" "$mirror:$version"
    verify "$mirror:$version" "$replacement"
    # The normal mirror publisher still verifies both tags before moving latest.
    ;;
  *) echo 'Expected archive or mirror action' >&2; exit 1 ;;
esac
