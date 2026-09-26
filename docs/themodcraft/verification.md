# Verification

## Overview cache

```sh
GOCACHE=/tmp/portainer-overview-cache-go-build go test \
  ./api/http/proxy/cache \
  ./api/http/proxy/factory/docker \
  ./api/http/proxy/factory/kubernetes \
  ./api/http/proxy \
  ./api/http \
  ./api/http/handler/docker \
  ./api/docker/stats \
  ./api/cmd/portainer

GOCACHE=/tmp/portainer-overview-cache-go-build go test -race \
  ./api/http/proxy/cache \
  ./api/http/proxy \
  ./api/http/handler/docker \
  ./api/docker/stats
```

## Custom versioning and footer

```sh
GOCACHE=/tmp/portainer-version-go-build go test ./api/http/handler/system
pnpm vitest run app/react/sidebar/Footer/Footer.test.tsx
```

After building an image, verify that `/api/system/version` reports `ServerVersion` equal to `RELEASE_VERSION`. The footer should show `Portainer Community Edition <release-version>` without the upstream `LTS` suffix.

## Release

```sh
bash -n scripts/build-release-context.sh
bash scripts/check-release-version.test.sh
git diff --check
file dist/release-context/amd64/portainer
file dist/release-context/arm64/portainer
(cd dist/release-context && shasum -a 256 -c SHA256SUMS)
docker buildx imagetools inspect themodcrafttmc/portainer:<release-version>
```

Execute-check both platform images before publishing and confirm that the immutable tag plus its channel alias (`beta` for prereleases, `latest` for stable releases) resolve to the same registry digest.

Run `pnpm typecheck`, `pnpm lint:ci`, `pnpm test`, and `go test ./...` before building a release. Backend Compose integration tests require Docker. Kubernetes integration tests require a reachable cluster; if the local kubeconfig points to an inactive cluster, set `KUBECONFIG` to a nonexistent temporary path to run unit tests with the live-cluster tests skipped. Record that limitation in the release verification.
