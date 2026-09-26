#!/usr/bin/env bash
set -euo pipefail

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
release_version=$(bash "$repository_root/scripts/check-release-version.sh" "${1:-}")
release_context="$repository_root/dist/release-context"
target_arches=(amd64 arm64)
channel_tag=latest
if [[ "$release_version" == *-beta.* ]]; then
  channel_tag=beta
fi

cd "$repository_root"

echo "Building Vessel HQ $release_version for linux/amd64 and linux/arm64"
CI=true pnpm install --frozen-lockfile
NODE_ENV=production pnpm run build --config webpack/webpack.production.js

rm -rf "$release_context"
mkdir -p "$release_context"

for target_arch in "${target_arches[@]}"; do
  RELEASE_VERSION="$release_version" CONTAINER_IMAGE_TAG="$release_version" SKIP_GO_GET=true ./build/build_binary.sh linux "$target_arch"
  mkdir -p "$release_context/$target_arch"
  cp dist/portainer "$release_context/$target_arch/portainer"
done

(cd "$release_context" && shasum -a 256 amd64/portainer arm64/portainer > SHA256SUMS)

cp -R dist/public "$release_context/public"
cp -R dist/mustache-templates "$release_context/mustache-templates"
cp build/release-context.Dockerfile "$release_context/Dockerfile"

git_commit=$(git rev-parse --short HEAD)
build_date=$(date -u +%Y-%m-%dT%H:%M:%SZ)

cat > "$release_context/BUILD-IMAGE.txt" <<EOF
docker buildx build --platform linux/amd64,linux/arm64 --build-arg RELEASE_VERSION=$release_version --build-arg GIT_COMMIT=$git_commit --build-arg BUILD_DATE=$build_date -t themodcrafttmc/portainer:$release_version --push .
docker buildx imagetools create -t themodcrafttmc/portainer:$channel_tag themodcrafttmc/portainer:$release_version
EOF

echo
echo "Release context ready: $release_context"
echo "Run:"
echo "  cd $release_context"
cat "$release_context/BUILD-IMAGE.txt"
