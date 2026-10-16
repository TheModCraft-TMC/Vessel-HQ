# Extension SDK workspace

The Go SDK and simple plugin authoring sources now live in the independent local project at `/Users/themodcraft/GolandProjects/vesselhq-extension-sdk`. The target preserves its existing `.idea` directory; its Git `origin` is configured as `https://github.com/TheModCraft-TMC/Vessel-HQ-Extension-SDK`. The existing local initial commit and origin were configured separately during extraction and were preserved. This source move does not publish a new module path or alter the immutable beta.1 tags.

Vessel consumes the published `github.com/TheModCraft-TMC/Vessel-HQ/sdk/go@v0.1.0-beta.1` module, including its generated protobuf contract, with no sibling checkout or `replace` directive required. [Published SDK API guide](https://github.com/TheModCraft-TMC/Vessel-HQ/blob/sdk/go/v0.1.0-beta.1/sdk/go/README.md) and [wire schema](https://github.com/TheModCraft-TMC/Vessel-HQ/blob/sdk/go/v0.1.0-beta.1/sdk/go/proto/v1/extension.proto) remain available at the immutable SDK tag.

## Ownership

The independent project owns the Go module, `proto/v1`, generation script, SDK race tests, native UI contract types, environment-summary and persistent-notes Go CLIs, operator development certificate helper, SDK source packager and CI. Its `plugins/` directory contains the minimal environment-summary UI, environment-summary-service template and persistent-notes UI. Its root README explains build, package and mTLS setup.

Vessel retains the React Flow Stack Network Overview authoring extension, trusted package builder, registration/grant storage, scoped host gRPC/HTTP implementation and host integration tests. Already installed native UI under `web-src/core/native-extensions/packages/` is assembled console input, rather than a second authoring workspace. Keeping the installed notes payload preserves the working console while its source is maintained in the SDK project.

## Independent development

```sh
cd /Users/themodcraft/GolandProjects/vesselhq-extension-sdk
GOWORK=off go test -race ./...
GOWORK=off go vet ./...
./generate.sh --check
node scripts/package-source.mjs --out /tmp/vessel-extension-sdk.tar.gz
node scripts/package-plugin.mjs --vessel-root /path/to/Vessel-HQ --plugin persistent-notes --out /tmp/persistent-notes.vesselhq
```

The plugin helper invokes Vessel's trusted source/archive policy. For the service template it first cross-compiles a real Linux executable from the standalone SDK. It recalculates the package digest in disposable staging, without mutating source manifests. Upload does not start an executable or grant permissions.

Host verification needs only the pinned published module:

```sh
GOWORK=off make test-extension-host
```

For joint local development, create an ignored `go.work.local` containing both `./backend-src` and `../vesselhq-extension-sdk`, then select it explicitly with `GOWORK="$PWD/go.work.local"`. Preserve the tracked root `go.work`; do not edit it for a machine-specific sibling checkout. Do not commit machine-specific replacements in `backend-src/go.mod`; CI and release builds must remain reproducible from the published SDK. Regenerate protobuf only in the standalone project and publish a new immutable SDK version before updating Vessel's dependency.

## Runtime scope

The SDK supports package-bound TLS 1.3 gRPC via a shared TCP gateway or private Unix socket, typed environment metadata reads and extension-owned note reads/compare-and-swap writes. Extensions need no per-stack published ports or Docker socket mounts. Infrastructure mutations, managed execution, reverse routing and production certificate lifecycle remain future host work.

The original application/SDK beta.1 release workflow remains part of immutable tag history. Current Vessel application releases no longer rebuild or republish the relocated SDK or simple plugin sources; those distributions belong to the independent project. Publishing from its configured remote and changing the canonical Go module identity require a separately reviewed release.
