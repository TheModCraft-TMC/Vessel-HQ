# Verification

Run frontend and release commands from the repository root. Run Go commands
from `backend-src/`; use `GOWORK=off` to verify the published SDK dependency
without a local workspace override.

## Frontend

```sh
pnpm check:frontend-modernization
pnpm check:frontend-boundaries
pnpm check:app-router-compliance
pnpm typecheck
pnpm test
pnpm lint:ci
pnpm build
```

For GitHub validation without image publication, dispatch
`.github/workflows/build-linux-image.yml` with `verify_only: true`. This runs
the frontend guards, type checking, tests, lint and production build; publishing
jobs are skipped. SDK checks run in the independent SDK repository; see the
[workspace guide](../extension-sdk-workspace.md).

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
pnpm exec vitest run web-src/ui/layouts/navigation/Footer/Footer.test.tsx
```

After building an image, verify that `/api/system/version` reports `ServerVersion` equal to `RELEASE_VERSION`. The footer should show Vessel HQ and the maintained release version without the upstream `LTS` suffix.

## Release

```sh
bash -n scripts/build-release-context.sh
bash scripts/check-release-version.test.sh
node --test build/next-entrypoint.test.cjs
git diff --check
file dist/release-context/amd64/portainer
file dist/release-context/arm64/portainer
(cd dist/release-context && shasum -a 256 -c SHA256SUMS)
docker buildx imagetools inspect themodcrafttmc/vessel-hq:<release-version>
```

Execute-check both platform images before publishing and confirm that the immutable tag plus its channel alias (`beta` for prereleases, `latest` for stable releases) resolve to the same registry digest.

Run `pnpm typecheck`, `pnpm lint:ci`, `pnpm test`, and `go test ./...` before building a release. Backend Compose integration tests require Docker. Kubernetes integration tests require a reachable cluster; if the local kubeconfig points to an inactive cluster, set `KUBECONFIG` to a nonexistent temporary path to run unit tests with the live-cluster tests skipped. Record that limitation in the release verification.


## Fresh npm advisory validation

Run `pnpm check:npm-security` for the recorded regression snapshot, then
`pnpm check:npm-security:fresh` for current advisory data against the lockfile.
The fresh check writes `dist/security/npm-audit.json`; moderate, high and critical
findings block validation, while low findings remain visible for scoped tracking.
Unavailable, malformed or incomplete results fail validation. CI retains reports
for 30 days on normal PR/stable, manual frontend and beta validation paths.
Run `node --test scripts/audit-npm-fresh.test.mjs scripts/deepmerge-security.test.mjs scripts/glob-compatibility.test.mjs`
to verify the gate, installed local deepmerge mitigation and glob compatibility.
pnpm 10 JSON mode exits 1 for any finding even with `--audit-level=moderate`;
the wrapper applies the severity policy to complete reports and rejects
unexpected process failures. The low deepmerge
advisory remains visible because no upstream patched release is available.
