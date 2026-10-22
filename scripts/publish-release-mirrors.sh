#!/usr/bin/env bash
# Copy one validated OCI index, including all platform manifests and blobs.
set -euo pipefail
source_image=${1:?source image required}
version=${2:?version required}
digest=${3:?index digest required}
shift 3
(( $# > 0 )) || { echo 'At least one destination is required' >&2; exit 1; }
[[ "$version" =~ ^[0-9]+(\.[0-9]+){2,}(-beta\.[1-9][0-9]*)?$ ]]
[[ "$digest" =~ ^sha256:[a-f0-9]{64}$ ]]
channel=latest
[[ "$version" != *-beta.* ]] || channel=beta
authfile=${DOCKER_CONFIG:-$HOME/.docker}/config.json
[[ -f "$authfile" ]]
lookup_error=$(mktemp)
trap 'rm -f "$lookup_error"' EXIT
verify() {
  local reference=$1 manifest
  manifest=$(docker buildx imagetools inspect "$reference" --format '{{json .Manifest}}')
  jq -e --arg digest "$digest" '.digest == $digest and ([.manifests[].platform | .os + "/" + .architecture] | index("linux/amd64") != null and index("linux/arm64") != null)' <<< "$manifest" >/dev/null
  for arch in amd64 arm64; do
    skopeo inspect --authfile "$authfile" --override-os linux --override-arch "$arch" "docker://$reference" >/dev/null
  done
}
verify "$source_image:$version"
# Refuse conflicting immutable tags before writing any destination.
for target in "$@"; do
  if existing=$(docker buildx imagetools inspect "$target:$version" --format '{{.Manifest.Digest}}' 2>"$lookup_error"); then
    [[ "$existing" == "$digest" ]] || { echo "Refusing to replace $target:$version ($existing)" >&2; exit 1; }
  elif ! grep -Eiq 'manifest unknown|not found|404' "$lookup_error"; then
    cat "$lookup_error" >&2
    exit 1
  fi
done
for target in "$@"; do
  skopeo copy --all --preserve-digests --retry-times 3 --authfile "$authfile" "docker://$source_image@$digest" "docker://$target:$version"
  verify "$target:$version"
done
# Channels move only after every immutable registry copy has passed verification.
for target in "$@"; do
  skopeo copy --all --preserve-digests --retry-times 3 --authfile "$authfile" "docker://$target@$digest" "docker://$target:$channel"
  verify "$target:$channel"
  printf '%s:%s@%s\n%s:%s@%s\n' "$target" "$version" "$digest" "$target" "$channel" "$digest"
done
