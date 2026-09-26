#!/usr/bin/env bash
set -euo pipefail

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/scripts"
cp "$repository_root/scripts/check-release-version.sh" "$fixture/scripts/"
printf '2.39.3.2.27\n' > "$fixture/RELEASE_VERSION"
export GITHUB_REF_TYPE=branch GITHUB_REF_NAME=develop

check_version() {
  bash "$fixture/scripts/check-release-version.sh" "$@"
}

expect_failure() {
  if check_version "$@" > /dev/null 2>&1; then
    echo "Expected release version validation to fail" >&2
    exit 1
  fi
}

[[ "$(check_version)" == 2.39.3.2.27 ]]
[[ "$(check_version 2.39.3.2.27)" == 2.39.3.2.27 ]]
expect_failure 2.39.3.2.24
expect_failure '2.39.3.2.27; echo unexpected'

export GITHUB_REF_TYPE=tag GITHUB_REF_NAME=v2.39.3.2.27
[[ "$(check_version)" == 2.39.3.2.27 ]]
export GITHUB_REF_NAME=v2.39.3.2.26
expect_failure
export GITHUB_REF_TYPE=branch

printf '2.39.3.2.27-beta.1\n' > "$fixture/RELEASE_VERSION"
[[ "$(check_version)" == 2.39.3.2.27-beta.1 ]]
[[ "$(check_version 2.39.3.2.27-beta.1)" == 2.39.3.2.27-beta.1 ]]
expect_failure 2.39.3.2.27
export GITHUB_REF_TYPE=tag GITHUB_REF_NAME=v2.39.3.2.27-beta.1
[[ "$(check_version)" == 2.39.3.2.27-beta.1 ]]
export GITHUB_REF_NAME=v2.39.3.2.27
expect_failure
export GITHUB_REF_TYPE=branch

for invalid_version in '' v2.39.3.2.27 2.39 2.39.3.2.27-rc1 2.39.3.2.27-beta 2.39.3.2.27-beta.0 2.39.3.2.27-beta.01 2.39.3.2.27-beta.x latest; do
  printf '%s\n' "$invalid_version" > "$fixture/RELEASE_VERSION"
  expect_failure
done

echo "Release version checks passed"
