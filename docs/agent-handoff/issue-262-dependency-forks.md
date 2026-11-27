# Issue #262 dependency migration

Status: all five forks published after explicit user approval, November 20, 2026.
Public proxy/checksum verification passed. The actual backend now uses the
published modules. Full application tests, module integrity and advisory scanning
have passed. The latest provider results are recorded below and in the
[current progress log](README.md).

## Published maintained sources

| Repository | Baseline | Necessary change | Published immutable tag |
| --- | --- | --- | --- |
| `TheModCraft-TMC/distribution` | Distribution 3.1.2 | Expose the current v3 client publicly, preserving digest verification and tests. | `v3.1.2-vessel.1` |
| `TheModCraft-TMC/cli` | CLI 29.9.3 | Migrate registry/manifest consumers to v3; preserve bytes, authentication and digest behavior; publish Go module metadata. | `v0.0.0-vessel.29.9.3.1` |
| `TheModCraft-TMC/compose` | Compose 5.7.1 | Consume the maintained CLI/v3 graph and remove obsolete requirements. | `v5.7.1-vessel.1` |
| `TheModCraft-TMC/container-libs` | image 5.42.1 | Migrate registry errors/API to v3, retaining image transport and authentication behavior. | `image/v5.42.1-vessel.1` |
| `TheModCraft-TMC/moby` | split SDK 0.6.3 | Retain four legacy version diagnostics without changing transport, negotiation or response-body ownership. | `client/v0.6.3-vessel.1` |

The CLI needs a fork-specific v0 tag because publishing a real go.mod changes
upstream's CalVer/+incompatible packaging assumption. Preserve its upstream
baseline in the tag and maintenance notes. Other tags follow their actual
module major versions and submodule prefixes. Public Kompose
`v1.38.0-vessel.1` is already available.

Current upstream Compose 5.8.0, CLI 29.10.0 and image 5.42.1 still retain old
Distribution v2 requirements. This candidate uses the narrower previously
adapted baselines rather than incorporating unrelated feature changes.

## Concrete local sources

- Current backend candidate: `dist/security/issue-262/continuation-20261120/`.
- Patched fork sources: `dist/security/issue-262/forks/`.
- Test/module/advisory receipts: `dist/verification-20261120/issue-262/`.
- Review inventory with base commits, patches, additional files and SHA-256:
  `dist/verification-20261120/issue-262/publication/plan.json`.

The raw inventory is a review input. Original experimental CLI/Compose module
files still contain local replacements. Staged copies under `publication/modules/`
replace these with the proposed public versions. Canonical module ZIPs and sums
were first tested through `publication/proxy/`, a task-local file Go proxy. Only
unpublished fork identities are excluded from remote checksum lookup during
that simulation. Subsequent fresh-cache verification through proxy.golang.org
and sum.golang.org passed for every published tag, without checksum exceptions.
See `publication/public-resolution.json`, `verify-public.exit` and `publish.exit`
(all final receipts are 0).
Root consumers must repeat all replacements explicitly: dependency replacements
do not propagate into the application.

## Completion sequence

1. Finish current-source backend tests, affected races and fresh advisory scan.
2. Prepare immutable source commits and public module metadata, preserving
   licenses and required attribution for the five sources above.
3. Publish those versions and verify public Go proxy/checksum resolution.
4. Apply the verified graph and compatibility edits to the real backend, preserve
   unrelated changes, and repeat application/provider compatibility checks.
5. Reconcile #262/#264 against actual acceptance. A clean local module graph
   alone does not establish the live provider matrix.

## Published source commits

All five repositories retain their default branch and description; fork workflows
are disabled. Source branch: `vessel/dependency-security-20261120`.

| Repository | Immutable source commit |
| --- | --- |
| [distribution](https://github.com/TheModCraft-TMC/distribution) | `b9cbecae19a34fbe40756992cfda6472a87a9729` |
| [moby](https://github.com/TheModCraft-TMC/moby) | `c589fee2759a49be1261a832e1989844338c8243` |
| [container-libs](https://github.com/TheModCraft-TMC/container-libs) | `0e8e6d47b62918a5b1103c349b5da3a23e120548` |
| [cli](https://github.com/TheModCraft-TMC/cli) | `7cd9d43e7d7311260f923d0ca7d22c17458f9c0e` |
| [compose](https://github.com/TheModCraft-TMC/compose) | `ebb225eddad761a99b127fded42d49b1faf57abf` |

Container-libs upstream now redirects to podman-container-tools/container-libs.
The recorded upstream repository ID was verified before resuming publication.
No tags were moved and no upstream repositories were changed.

Application verification receipts are in
`dist/verification-20261120/issue-262/application/`. Provider runtime acceptance
is separate; a local Docker image-inspection attempt returned HTTP 500, so no
new live container deployment is claimed. No application release was deployed.

## Application acceptance — November 21, 2026

| Scope | Evidence | Remaining acceptance |
| --- | --- | --- |
| Published module graph | 755 modules; no Docker monolith, Distribution v2 or local-path replacements; public checksum verification and application `go mod verify` pass | Keep the immutable published identities in the application |
| Actual backend | Full suite exit 0, 157 passing test packages | Linux artifacts and provider runtime checks below |
| Advisory scan | Actual full-source Go 1.26.11 / darwin-arm64 JSON has zero finding records | Other target platforms are not certified by this scan |
| Docker / Compose | Application HTTP/Unix/TLS negotiation and actual Compose service fixtures; client and Compose affected race tests pass | Updated-binary live Docker deployment and Compose lifecycle |
| Registry auth / digest | Published Distribution/CLI/image source suites and application registry race tests pass | Live authenticated push/pull and digest rejection through the migrated application |
| Swarm | Full application tests include CLI negotiation/manager checks and registry-auth serialization | Supplemental race suite now passes; live disposable Swarm deployment remains |
| Podman | Image-library source tests and actual application full suite pass | Updated-binary live Podman lifecycle |
| Kubernetes | Full suite includes stable-HPA Kompose conversion and Kubernetes client/handler tests | Updated-binary live Kubernetes apply/cleanup |

The configured local Docker socket was absent when checked. The existing isolated
platform harness therefore cannot establish these runtime rows in this session.
Do not mark fixture checks or historical binary runs as current provider acceptance.
No residual provider incompatibility is accepted or assigned to a maintainer by
this document. #262 and dependent umbrella #264 remain open.

November 21 build blocker: Avira quarantined the generated Linux amd64 executable as
`PUA/LINUX.Chisel.G` (existing Edge tunnel dependency), after linking and before
Go's build-ID rewrite. A minimal Go Linux binary builds normally. The application
binary was not restored or allowlisted, and arm64 was not attempted after this
confirmation. User security review is pending for that executable. The following
Linux arm64 run used a fresh review-branch build and a responsive engine.

## Linux arm64 provider acceptance — November 26, 2026

The application on PR #303 was compiled using Go 1.26.11, `GOWORK=off` and
`-mod=readonly`. ELF build metadata records source commit
`4034bcf79678aec6f79a9b298418dc47cd38f4ba` and the five published fork versions.
The artifact's SHA-256 is
`3f192fb7ed92b314ef53d674b081c1e458ac91cd6a98dfd25b1000c81d24ae73`.
The published Vessel 1.3.3 image supplied runtime files while each test mounted
the freshly built executable. The five focused HA, Docker, Kubernetes,
registry-handler and websocket Go race packages passed.

- Docker and Swarm 29.10.1 passed API environment and container lifecycle,
  logs and stack create/update/delete. Swarm also replaced running tasks on
  service force-update.
- Podman 5.8.1 passed environment and container lifecycle, logs and Compose
  stack create/update/delete.
- A disposable Distribution v3 registry denied anonymous push and incorrect
  credentials. The Vessel API authenticated, pushed an image, listed repositories
  and tags, pulled by digest and rejected an unknown digest.
- Kubernetes v1.35.0 passed environment, namespace and deployment lifecycle
  and stack apply/delete using in-cluster service-account authentication. The
  first Kind run tried to import a multi-platform index with only arm64 cached.
  The successful rerun loaded the verified arm64 manifest directly.

Receipts are in `dist/remaining-issues-20261126/provider/` as `platform.json`,
`registry-retry.json` and `kubernetes-retry.json`. Fixture cleanup passed. The
verified [Linux dependency scan](https://github.com/TheModCraft-TMC/Vessel-HQ/actions/runs/45685749811)
ran against the same module graph and recorded zero findings. This completes
the #262 acceptance matrix on the review candidate. The fix still needs
integration before closing #262 and the #264 tracker.
