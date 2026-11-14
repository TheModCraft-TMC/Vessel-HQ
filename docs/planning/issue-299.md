# Issue #299 implementation and acceptance

This checklist separates source delivery from infrastructure acceptance. The issue
remains open until its remaining acceptance items are resolved. Publishing the SDK
does not activate extensions or establish full Business Edition parity.

| Request | Current source and evidence | Remaining acceptance |
| --- | --- | --- |
| Extension integration | Package schemas, host validation, separate machine settings grants, typed mTLS settings reads; standalone SDK beta.2 published with source archive/checksum | Public Go proxy/checksum resolution now verified; affected host race tests pass without replacements. Production identity/startup lifecycle remains separate |
| External container synchronization | One shared Docker event stream per viewed environment; coalesced invalidation, bounded subscribers, stream cancellation, current authorization and session rechecks; HTTP-stream and revocation race tests | Authenticated remote Docker event receipt measured at 229 ms in the live disposable-engine test; remote-agent reconnect and event-driven browser coverage remain |
| Images/networks/volumes spacing | Existing shared layout verified at 390px and 1440px with production console and synthetic remote-engine responses; identical heading offsets and no page overflow | Authenticated production routes and populated data remain separate runtime coverage |
| Source-available edition capabilities | Existing source-backed Git reference and file browsing now depends on source availability; manual entry and HEAD remain supported; explicit unadvertised refs preserved | Inventory and acceptance for capabilities absent from CE source; no blanket edition toggle or complete BE-parity claim |
| Optional HA and Kubernetes | Explicit shared-storage active/standby gate before all datastore initialization; Kubernetes and two-host Compose examples; disabled default, lock exclusivity, cancellation and process-exit takeover tests | Cross-host coherent locking/mmap, storage fencing, host/node failure and ingress convergence on selected infrastructure |
| Remote environments | Existing authenticated remote Docker/agent paths retained; event watcher uses the existing client factory and environment authorization | Live remote Docker/Edge, Swarm, Podman, Kubernetes and ACI compatibility matrix |
| Settings and build management | Schema-aware save, write-only secrets, optimistic concurrency, runtime reads; existing complete-set builder ownership, progress receipts, sanitized events, cancellation cleanup and approval rechecks retained; 72 builder tests pass | Settings save/reset/conflict, secret redaction and role denial passed against a running API; extension builder execution and production activation remain separate |
| Master webhook gateway | Optional private configuration, route-bound timestamped HMAC, local allowlisted fan-out, bounded concurrency, durable at-most-once reservation and outcome audit; replay/restart/concurrency/denial tests | Live allowlisted Swarm delivery, replay denial and persisted replay rejection after abrupt HA takeover passed; operator configuration and provider coverage remain; no queued retry guarantee |
| Upstream changes | Seven reviewed Compose, Kubernetes, Docker-volume, Git and Helm backports adapted; focused package and race coverage | Live provider matrix; [application prerelease assets](https://github.com/TheModCraft-TMC/Vessel-HQ/releases/tag/v1.3.3-beta.1) published from source commit `beae78041` |
| Activity log | Strict date/sort validation, exact filters, deterministic sorting, no-store and spreadsheet-safe CSV; package tests pass | Production UI/export check with real retained data |

## Verification record — November 14, 2026

- SDK race tests, vet, pinned protobuf regeneration and public source packaging
  passed locally. The published tag is `v0.1.0-beta.2` at commit
  `1f1021142f179ddad3b9ccdf3071e298a6f2d71c`. GitHub Actions dispatch is unavailable:
  GitHub returned “Actions has been disabled for this user.”
- The production frontend build, typecheck, modernization, boundaries, App Router
  and lint gates passed. Lint reports existing warnings with zero errors.
- The final clean Linux frontend run passed **377 files and 2,537 tests**, with
  five skipped tests and eleven todo cases. All required architecture guards,
  typecheck, lint and production build passed on Node 24.21.0 / pnpm 10.26.2.
  The final backend-only fix did not change the validated frontend tree
  (`29734481807c8a539497f7b7227d7fee0868f011`).
- The recorded npm regression check passed. A fresh advisory query returned zero
  moderate/high/critical findings and one low finding.
- Affected backend packages passed their focused tests. Race runs cover settings,
  activity, HA, gateway, Kubernetes cleanup, Compose, UAC, Docker, Git, Helm and
  event streams. Initial development validation used an explicit temporary SDK replacement.
  The immutable beta.2 module is now verified through the public Go proxy and
  checksum service, with recorded dependency checksums; affected host race tests passed
  with `GOWORK=off`.
- Headless screenshots and geometry results are local artifacts under
  `output/playwright/issue-299-*`; fixtures contain no real credentials or private
  infrastructure. These are not README publication screenshots.

Do not promote a stable image, close #299, or describe HA as production-ready on
the strength of local source/fixture validation alone. Application publication
must use a new immutable version and preserve unrelated concurrent changes.

### Git browsing request-path completion

Review found that repository listing methods existed in the Git service but the
HTTP routes were absent, and the query hooks still checked edition. This candidate
now wires source-bound POST routes for refs and deployment-file search, with normal
source read authorization, SSRF enforcement, stored credentials, request/deadline
and result bounds, and value-free errors. Caller-supplied repository URLs or
credentials are rejected. API contracts were regenerated with `make generate-api`.
Route tests cover successful requests, denied private-source access, invalid
payloads and credential redaction. UI tests now assert actual requests in CE.

### Live runtime and image verification

Nine live checks passed against a disposable remote Docker engine: authenticated
remote access; event receipt in 229 ms; Git refs/files and source denial; settings
save/reset, optimistic concurrency, secret handling and role denial; activity
validation/export redaction; session revocation closing an event stream; standby
startup before HTTP/datastore initialization; signed local Swarm webhook delivery
and replay denial; abrupt active-process termination, standby takeover and
persisted replay reservations. The same-host shared-storage takeover test does
not establish cross-host fencing, partition safety or Kubernetes node failover.

Both final Linux binaries were compiled against the published SDK with
`GOWORK=off`. The multi-platform OCI candidate includes `linux/amd64` and
`linux/arm64`, with index digest
`sha256:5023ec8da3ef7a85201fa557cf6d4afcdbb9ddf7b9da96bd9c1cb8bb55071aa9`.
The amd64 container passed API status and built Next.js login HTML checks;
API compatibility remains 2.45.0 and the image release label is 1.3.3-beta.1.
Arm64 runtime execution remains separate from binary and manifest validation.
Registry publication requires a working Docker Hub/GHCR login; an OCI archive
is an offline candidate, not evidence of a published registry tag.

The [GitHub prerelease](https://github.com/TheModCraft-TMC/Vessel-HQ/releases/tag/v1.3.3-beta.1)
contains architecture bundles, the OCI archive, SHA256SUMS and sanitized validation
receipts. All nine uploaded asset sizes and GitHub SHA-256 digests were checked
against the local files. Stable `latest` remains unchanged. The release tag pins
the implementation commit; subsequent verification documentation does not retag it.

Source capability inventory: the Sources pages and source/workflow domain paths
have no remaining edition gate. Repository refs and deployment-file browsing are
backed by authorized stored-source HTTP routes. Edition gates elsewhere (including
change-window display, Edge management, backup and RBAC) are separate capabilities;
for example, the CE API has no change-window implementation to expose safely.


### Final Linux backend suite

The clean `GOWORK=off go test -mod=readonly ./...` run completed with exit code 0
on Go 1.26.11 / linux/amd64: **156 test packages passed**. The published SDK was
resolved normally. The prerelease now also includes `backend-validation.log` and
`backend-validation.sha256`; the original nine assets remain unchanged. The
amd64 image's `--version` output is `1.3.3-beta.1`.

The slow Mac broad run was superseded, and the initial Linux attempt blocked by
a no-exec temporary mount is excluded. The clean rerun used an executable,
bounded memory filesystem for compilation; its complete passing log is the final
evidence. All task containers, temporary mounts, caches, network and scratch
sources were removed after saving the sanitized results.
