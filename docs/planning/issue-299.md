# Issue #299 implementation and acceptance

This checklist separates source delivery from infrastructure acceptance. The issue
remains open until its remaining acceptance items are resolved. Publishing the SDK
does not activate extensions or establish full Business Edition parity.

| Request | Current source and evidence | Remaining acceptance |
| --- | --- | --- |
| Extension integration | Package schemas, host validation, separate machine settings grants, typed mTLS settings reads; standalone SDK beta.2 published with source archive/checksum | Public Go proxy/checksum resolution now verified; affected host race tests pass without replacements. Production identity/startup lifecycle remains separate |
| External container synchronization | One shared Docker event stream per viewed environment; coalesced invalidation, bounded subscribers, stream cancellation, current authorization and session rechecks; HTTP-stream and revocation race tests | Live Docker/remote-agent reconnect and event-driven browser check |
| Images/networks/volumes spacing | Existing shared layout verified at 390px and 1440px with production console and synthetic remote-engine responses; identical heading offsets and no page overflow | Authenticated production routes and populated data remain separate runtime coverage |
| Source-available edition capabilities | Existing source-backed Git reference and file browsing now depends on source availability; manual entry and HEAD remain supported; explicit unadvertised refs preserved | Inventory and acceptance for capabilities absent from CE source; no blanket edition toggle or complete BE-parity claim |
| Optional HA and Kubernetes | Explicit shared-storage active/standby gate before all datastore initialization; Kubernetes and two-host Compose examples; disabled default, lock exclusivity, cancellation and process-exit takeover tests | Cross-host coherent locking/mmap, storage fencing, host/node failure and ingress convergence on selected infrastructure |
| Remote environments | Existing authenticated remote Docker/agent paths retained; event watcher uses the existing client factory and environment authorization | Live remote Docker/Edge, Swarm, Podman, Kubernetes and ACI compatibility matrix |
| Settings and build management | Schema-aware save, write-only secrets, optimistic concurrency, runtime reads; existing complete-set builder ownership, progress receipts, sanitized events, cancellation cleanup and approval rechecks retained; 72 builder tests pass | Isolated Docker builder execution and runtime activation remain unavailable locally while Docker is stopped |
| Master webhook gateway | Optional private configuration, route-bound timestamped HMAC, local allowlisted fan-out, bounded concurrency, durable at-most-once reservation and outcome audit; replay/restart/concurrency/denial tests | Operator gateway configuration and a live target delivery; no queued retry guarantee |
| Upstream changes | Seven reviewed Compose, Kubernetes, Docker-volume, Git and Helm backports adapted; focused package and race coverage | Live provider matrix and a published application candidate |
| Activity log | Strict date/sort validation, exact filters, deterministic sorting, no-store and spreadsheet-safe CSV; package tests pass | Production UI/export check with real retained data |

## Verification record — November 14, 2026

- SDK race tests, vet, pinned protobuf regeneration and public source packaging
  passed locally. The published tag is `v0.1.0-beta.2` at commit
  `1f1021142f179ddad3b9ccdf3071e298a6f2d71c`. GitHub Actions dispatch is unavailable:
  GitHub returned “Actions has been disabled for this user.”
- The production frontend build, typecheck, modernization, boundaries, App Router
  and lint gates passed. Lint reports existing warnings with zero errors.
- The full frontend run completed 375 files: 374 passed and one failed due to a
  test fixture's `data-testid` attribute while this repository configures
  `data-cy`. After correction, the final changed set passed 43 tests in six files;
  the new reference selector tests also pass. Five skipped tests and eleven todo
  cases in the full suite remain explicitly unexecuted.
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
