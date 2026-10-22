# Vessel HQ 1.3.1-beta.1: native extensions preview

This prerelease builds the current Vessel HQ application with the experimental
native extension system and Go SDK v0.1.0-beta.1. It is published from the
`feature/native-extensions-prerelease` branch; the stable release remains unchanged.
The upstream API/datastore compatibility baseline remains Portainer 2.45.0.

Use this experimental release with trusted administrators in a test environment.
It is not a complete upstream security backport. Confirmed inherited gaps remain
in Compose host-file restrictions, Kubernetes namespace cleanup authorization,
in-cluster kubectl TLS verification, and Git HTTP/Helm SSRF handling. Review the
[security applicability report](https://github.com/TheModCraft-TMC/Vessel-HQ/blob/v1.3.1-beta.1/docs/security/upstream-2026-10-16.md) for evidence,
preconditions and the distinction between fixed and outstanding issues.

This document records the immutable beta.1 tag contents and its original workflow. SDK and simple demo authoring sources have since [moved to an independent workspace](../extension-sdk-workspace.md). Current Vessel application workflows consume the published SDK and no longer rebuild/release those SDK assets. The tagged beta.1 workflow and module remain unchanged.

## Application distribution

GitHub release assets contain complete Linux amd64/arm64 application archives,
the public SDK source, standalone SDK example executables, the two `.vesselhq`
example source packages and `SHA256SUMS`.
`IMAGE.txt` records the verified multi-architecture container digest. Container
images use `themodcrafttmc/vessel-hq:1.3.1-beta.1` and
`ghcr.io/themodcraft-tmc/vessel-hq:1.3.1-beta.1`, with a `:beta` channel in both
registries. One validated multi-architecture build is copied with all manifests
and blobs while preserving the index digest; previews never update `latest`.
The workflows require `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` repository
secrets and use `GITHUB_TOKEN` for GHCR. An existing successful tagged beta can
be mirrored without rebuilding by dispatching `build-linux-image.yml` with
`version_tag` and its verified GHCR index `mirror_source_digest`. Conflicting
immutable destination tags are rejected.
There is no stable `:latest` promotion.

The application archives contain `<architecture>/portainer`, the Next.js runtime,
the launcher and templates. They are release packaging inputs; use the container
image for a combined server/console deployment. Back up the datastore before
testing a prerelease, and retain the previous image and backup for rollback.

## Go module distribution

```sh
go get github.com/TheModCraft-TMC/Vessel-HQ/sdk/go@v0.1.0-beta.1
```

The public Go module is rooted at `sdk/go`; its repository tag must be
`sdk/go/v0.1.0-beta.1`, pointing to the same reviewed commit as the application tag
`v1.3.1-beta.1`. A GitHub release archive alone does not publish a Go module.
Go's module proxy and checksum database discover that immutable submodule tag.
A separate SDK GitHub prerelease carries the SDK archive, Linux examples and
their checksums, built from that same commit. This is a Go module publication
through Git tags, rather than a GitHub Packages Go registry.
If a proxy has not indexed the version yet, retry after indexing or use
`GOPROXY=direct` for the first download. No local `replace` is needed for consumers.

The SDK handles bounded gRPC calls, cancellation, TLS 1.3, package-bound mTLS
identity and typed environment reads. Persistent extension-owned notes support
independent service read/write grants, approval revisions and atomic version
checks. A shared private Unix socket or an internal service address avoids
published ports on every stack. Extensions do not receive the Docker socket.
See the [SDK guide](https://github.com/TheModCraft-TMC/Vessel-HQ/blob/v1.3.1-beta.1/sdk/go/README.md) for configuration and examples.

## Preview behavior and limits

The included examples demonstrate stack network topology, configured Traefik
routes from Docker labels, live Docker receive/transmit byte counters and shared
UI/service note storage. Docker byte counters are not HTTP request counts or
latency. Those need a Traefik metrics or access-log source. Swarm task byte
sampling is not implemented.

Native extension code is compiled into the console by an operator-reviewed build.
Registrations and capability grants remain necessary before a compiled example
appears. Upload the included `.vesselhq` example in the administrator Extensions
screen, then review and approve its native UI trust and requested grants. The
network example manifest targets environment 1 and stack 1; adjust its manifest
and repack it for another target before uploading, as shown in the
[network example guide](https://github.com/TheModCraft-TMC/Vessel-HQ/blob/v1.3.1-beta.1/examples/native-extensions/stack-network-overview/README.md).
This preview does not activate uploaded production code dynamically:
the development build receipt explicitly has `productionActivatable: false`.
Managed extension service startup, infrastructure mutations, reverse service
routing and production certificate issuance/rotation remain future work.
Development certificates and local runtime data are excluded from every asset.

## Release verification

The backend and SDK use gRPC-Go 1.83.2, which includes the receive-buffer
compaction fix for fragmented HTTP/2 DATA frame memory exhaustion
([CVE-2026-84304 / GHSA-vp52-pcj8-j9qc](https://github.com/grpc/grpc-go/security/advisories/GHSA-vp52-pcj8-j9qc)).
An approved mTLS peer still reaches the transport layer before RPC capability
checks, so message-size limits alone do not replace this dependency fix. The
release also carries the focused upstream resource-control authorization fix;
the API/datastore compatibility baseline remains unchanged.

The tag workflow runs frontend architecture guards, type checking, frontend and
extension tests, lint, the production console build, backend tests, SDK race/vet
checks, generated-contract verification and both Linux architecture builds. It
executes both container architectures before publishing the immutable image,
verifies its platforms/digest, then promotes only the beta channel. The GitHub
release is created after successful image publication. A failed workflow is not
evidence of a published or verified build; consult the linked Actions run.
