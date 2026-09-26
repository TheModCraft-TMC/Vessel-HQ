#!/usr/bin/env bash
set -euo pipefail

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
release_version=$(tr -d '[:space:]' < "$repository_root/RELEASE_VERSION")

if [[ ! "$release_version" =~ ^[0-9]+(\.[0-9]+){2,}(-beta\.[1-9][0-9]*)?$ ]]; then
  echo "Invalid maintained release version: $release_version" >&2
  exit 1
fi

if [[ -n "${1:-}" && "$1" != "$release_version" ]]; then
  echo "Requested version $1 does not match RELEASE_VERSION ($release_version)" >&2
  exit 1
fi

if [[ "${GITHUB_REF_TYPE:-}" == tag && "${GITHUB_REF_NAME:-}" != "v$release_version" ]]; then
  echo "Release tag ${GITHUB_REF_NAME:-} does not match v$release_version" >&2
  exit 1
fi

printf '%s\n' "$release_version"
