# Migration change summary and release commit message

Status: release candidate validation, October 12, 2026. The maintainer confirmed both migration agents have finished. This records the integrated changes and fresh release checks; publication results are reported separately.

## Native extension implementation follow-up — October 15, 2026

This scope is separate from the historical release/migration and the earlier
design-only draft below. The maintainer authorized implementation using sub-agents.

- Added admin-only whole-package `.vesselhq` ZIP upload, durable immutable archive
  storage, strict manifest/source digests, bounds/path/link checks, and declared
  Linux AMD64/ARM64 ELF backend validation. Backend executables never enter the
  browser source tree and are not executed on upload.
- Added persistent registry/approval/revocation/removal, atomic lifecycle auditing,
  revision-bound grants, and a distinct explicit unattended service-read approval.
- Added compact native extension cards, an upload tile, dedicated detail pages,
  and protected settings/permission dialogs, following the maintainer's reference
  manager structure while using Vessel components/tokens.
- Added native lazy candidate preview with approval/digest checks and browser-only
  loading, protected staging/container-validation tooling, and source-policy checks.
- Added opt-in mTLS gRPC registration diagnostics and real scoped environment
  metadata reads, read audit enforcement, a working Go reference client, private
  local certificate provisioning, and a package example with a Go backend payload.
- Added a versioned native Docker stack action slot and top drawer host, an SDK
  broker, explicit environment/stack topology grants, and a genuine private mTLS
  gRPC delegated read path. The host intersects current user/resource access with
  current package grants before and after reads. Provider DTOs and unrelated
  network members never enter the extension response.
- Added a pinned React Flow renderer and package example with graph controls,
  accessible topology listing, bounded reads, manual refresh and error handling.
  Extended immutable package extraction/staging and a development-only compiled
  source selection controller with protected-input/approval rechecks and rollback
  on failed selection. Production activation remains unavailable.
- Restored development auto-login for the local process. Added a server-only
  opt-out from automatic Docker endpoint creation for separately managed backends;
  production still cannot use development credentials.

Managed backend startup, background build orchestration, production activation,
and rollback remain unavailable; see [current scope](../native-extensions.md).

Fresh verification:

- Follow-up stack scope: the production webpack build and standalone packaging
  passed. Lint passed with zero errors and 196 warnings; architecture guards
  checked 3,287 frontend source files and 168 App Router pages. Focused extension
  graph tests passed (11), permission/admin tests passed (23), and native
  host/broker service tests passed (17). A test-only unsupported TypeScript
  matcher option was corrected before the successful final build.
- The follow-up full frontend suite passed: 349 files, 2,346 tests passed, five
  skipped and 11 todo using four workers. The final UI entry-point binding
  (in addition to package digest and slot metadata) passed 30 focused host,
  preview and broker-service tests and a fresh full typecheck. An earlier
  unrestricted worker run was stopped to reduce local memory pressure.
- At the maintainer's requested stopping point, the latest isolated candidate
  build was interrupted and no native package source was selected into the
  running console. Live topology/API checks passed, but the final compiled
  button/drawer browser check remains outstanding. A private local continuation
  record preserves candidate/image identities, current approvals and next steps.
- Follow-up backend race checks passed for native extension policy/package/RPC,
  Compose/Swarm topology adapters, authenticated admin/broker handlers, HTTP and
  datastore packages. Tests cover real mTLS, signed user delegation, non-admin
  sessions, current access, cross-scope reads, concurrent revocation, provider
  resource filtering and audit failure. A scoped live local call returned two
  workloads, two networks, three attachments and one internal network through
  HTTP → private mTLS gRPC → Docker; stack 2 returned 403. The maintainer explicitly
  approved only the new local test package's environment 1 / stack 1 scopes and
  native UI trust, with unattended access disabled. Other grants were preserved.

Earlier metadata/upload slice verification (before the stack follow-up above):

- Full frontend suite passed before the final reference-layout adjustment:
  344 files, 2,317 tests passed, five skipped, 11 todo. After final compact-layout
  polish, changed extension, native host, and development-session suites passed
  together: seven files, 36 tests. An earlier full-suite attempt was interrupted
  to prioritize dev startup; these later results supersede it.
- All three architecture guards passed: 3,281 frontend source files and 168 App
  Router pages. Final typecheck passed. Lint passed with zero errors and 196
  warnings. Final production webpack build with standalone packaging passed.
- All 48 builder/source-policy/archive tests passed. Node packing and Go archive
  inspection agreed on both source inventory and exact archive digests.
- Backend policy/package/gRPC/admin lifecycle tests passed with the race detector.
  HTTP server, datastore/migration, and reference-client tests passed. The Go
  reference client tests include a real local TCP/mTLS handshake.
- Live local gRPC returned the actual environment 1 metadata, denied environment 2,
  and denied calls after disable. Allowed/denied audit records were verified.
  Subsequent user changes to service-read approval were preserved; no test reset
  overrode them.
- A real 4,546,083-byte `.vesselhq` containing UI and a Linux AMD64 Go executable
  uploaded successfully over the actual admin API. Retained bytes matched exactly.
  The new registration remained pending with no grants, native trust, or service
  approval; no executable was extracted or launched.
- Development auto-login returned HTTP 200 after explicit maintainer authorization.
  Browser checks covered unauthenticated extension redirect and desktop/mobile
  login rendering (no horizontal overflow at 390×844). Initial authenticated test
  sign-in was blocked by automatic approval review and skipped at the maintainer's
  request; later auto-login was separately authorized. The supplied external
  reference manager/configuration dialog was inspected read-only, with no settings
  saved. After authorized auto-login, local manager cards, detail navigation, and
  the gear settings dialog rendered correctly; permission boxes were unchecked,
  and no browser permission/save/remove actions were performed. At 390×844 the
  final manager used one column, 313-pixel cards within the viewport, and no
  horizontal document overflow. The temporary viewport override was reset.
- Node 24.21.0 was obtained in temporary storage and checked against official SHA256
  metadata because the installed Homebrew Node 24 cannot load its simdjson library.
  At that earlier checkpoint Docker was unavailable and isolated candidate
  compilation was unverified; the stack follow-up uses the now-running daemon. No live Swarm/Podman/Kubernetes/Azure workflow verification or
  production deployment was performed. Local dev remains running against its
  separate data directory, including the user's environment and permission edits.

Draft commit message for this implementation:

```text
feat: add native extension packages and scoped gRPC metadata reads

Add whole-package UI/backend uploads, admin grants and lifecycle auditing,
native extension management, protected candidate builds, and an mTLS read API.
Keep managed backend execution and production activation disabled.
```

## Earlier native extension design follow-up — October 15, 2026

This documentation-only follow-up is separate from the historical release and
migration scope below. It replaces the companion-application-first proposal with
administrator-trusted native compiled UI, protected core inputs and integrity
gates, isolated backend services, and scoped gRPC grants. It specifies candidate
build validation, activation, rollback, revocation, and emergency recovery while
explicitly documenting that checksums do not isolate native browser JavaScript.
No runtime implementation, deployment, or schedule is included.

Draft commit message for this follow-up:

```text
docs: draft native extension trust and build lifecycle

Define administrator approval, protected build inputs, scoped gRPC grants,
and candidate activation/recovery for native Vessel UI extensions.
Align the roadmap and documentation entry points with the design draft.
```

Fresh verification: `git diff --check` passed; all eight added local Markdown
link targets in the documentation diff resolve to existing paths.
Application builds, tests, and browser checks are outside this documentation-only
scope. The historical release commit message and results below are unchanged.

## Draft commit message

```text
release: finalize Vessel HQ 1.3.0

Move frontend ownership into core, domains, providers, shared, and ui,
and remove the obsolete legacy source tree and compatibility imports.
Keep Next.js App Router routes and layouts as application entry points.

Align generated API paths, architecture enforcement, route compliance,
and frontend configuration with the canonical source layout.
Enable React Compiler and use Turbopack for local development.
Update shared UI integrations and development diagnostics.

Rewrite the README for Vessel HQ and document future companion add-ons,
scoped access, managed deployment, and explicit UI extension points.

Preserve the earlier 1.3.0 publication as 1.3.0-beta.1 before replacing
the stable release and image at the maintainer's explicit request.
```

Reconcile this draft with the final diff and add exact validation results before committing. Plugin support is documentation only. Maintaining this file does not create a commit or release.

## Post-1.3.0 table rendering fix — October 12, 2026

This follow-up is separate from the historical release scope below. Production
1.3.0 showed empty Images rows that appeared after leaving and returning, and
empty Networks rows alongside a four-page paginator. React Compiler cached
reads from TanStack Table's mutable, identity-stable instances. A fresh
compiler-enabled regression reproduced missing asynchronously loaded rows and
stale selection; both passed after the fix.

- Exclude shared table owners and components reading mutable table/row/cell
  instances from compiler memoization using `use no memo`, including basic,
  nested, and expandable variants. Keep React Compiler enabled elsewhere.
- Compile shared table components in Vitest to exercise the production behavior;
  cover arriving, removed, and replaced datasets without remounting.
- Local browser verification: Images populated after a full reload; Networks
  populated on navigation. Production deployment and smoke results follow.
- Fresh architecture guards (3,263 source files; 166 routes), typecheck, and
  production webpack build with standalone packaging passed. Lint passed with
  zero errors and 196 warnings. Focused compiler-enabled table tests passed:
  six files, 101 tests. The full suite passed: 340 files, 2,289 passed, five
  skipped, 11 todo; the newly added variant file passed separately (four tests).
  No live Kubernetes, Swarm, Podman, or Azure ACI verification was performed
  for this follow-up.
- Published the maintainer-authorized replacement `1.3.0` image for AMD64 and
  ARM64; both executed `--version` successfully. Source revision: `ad82c982b`.
  OCI index: `sha256:759c58b7501b4fe23cd07dde2a3c7c4ec0bc4016e7abaffa2b01e1af3ab951c8`.
  Updated the GitHub `v1.3.0` tag and release notes; beta archive unchanged.
- Deployed that exact digest to Node4, preserving ports, mounts, bridge
  networking, and restart policy. `/api/status` passed and the binary reports
  `1.3.0`. Retained `portainer-rollback-1.3.0-before-table-fix-20261012`.
  An initial health script hit an authenticated version endpoint (401) and
  restored the prior container; the corrected binary-version check passed.
- Production browser smoke passed: Images showed 54 data rows on first visit
  and after a full reload; Networks showed 10 data rows on its first page and
  after return navigation; Containers showed 25 data rows on its first page.
  The `latest` channel remains unchanged pending explicit approval.

## Observed migration changes

| Area | Current working-tree change | Evidence / handoff |
| --- | --- | --- |
| Source ownership | Canonical core/domain/provider/shared/UI roots replace `web-src/legacy` | [Architecture](frontend-domain-provider-architecture.md); review deletions and new destinations together as moves |
| App Router | Console layouts and Docker, Kubernetes, Azure, administration, and delivery routes reference migrated owners | `web-src/app/`; [route index](../../reports/app-router-page-index.md) |
| Console composition | Query, application bindings, sidebar state, session, and layout bindings assembled in core | `web-src/core/console/ConsoleProviders.tsx` |
| Boundaries | Architecture checks and inventories align with canonical ownership; compatibility budgets removed as callers migrate | `scripts/check-frontend-boundaries.mjs`; [provider inventory](provider-migration-inventory.md) |
| Generated API | Client output and runtime HTTP configuration point into core/shared roots | `openapi-ts.config.ts` |
| Development/build | React Compiler enabled, Turbopack development, SVG/YAML resolution, analysis command | `web-src/next.config.ts`, `scripts/start-frontend-dev.mjs`, `package.json` |
| Shared UI | Radix dropdown replaces Reach menu dependencies; related compatibility patch removed | `package.json`, `pnpm-lock.yaml`, `web-src/ui/` |
| Diagnostics | Development-only LogRocket initialization with URL/header/body/input sanitization and corresponding CSP origins | `web-src/instrumentation-client.ts`, `web-src/proxy.ts` |
| Documentation | Architecture, slices, realtime, roadmap, and progress records updated | [Roadmap](vessel-hq-roadmap.md), [earlier migration progress](frontend-refactor-progress-2026-09-23.md) |

Historical Angular removal and GitOps/Vault/access-control enhancements predate this working-tree summary. See the [feature catalog](../recent-features/README.md) and roadmap for that history; do not imply they were all introduced by this commit. Exact final file counts are intentionally omitted while agents are still editing.

## Documentation changes in this pass

- Rewrote the root README around Vessel HQ, local development, canonical ownership, and current generated API paths.
- Added the [future plugin proposal](plugin-system.md), effort estimates, phased delivery, authorization, browser isolation, and lifecycle decisions.
- Linked the proposal and this handoff from planning/customization indexes.
- Corrected roadmap wording that described the pre-Next.js architecture.
- Replaced the README text title with theme-aware Vessel logos and grouped release, Portainer CE fork, Turbopack, and maintainer-reported GPT-5.6 Sol migration badges.
- Captured the running local Docker dashboard in `docs/assets/docker-overview.jpg` as the README banner.
- Replaced the plain Turbopack badge with a local SVG using a red/purple/blue gradient and the same 28-pixel badge height.
- Added root `AGENTS.md` guidance and expanded frontend instructions for canonical ownership, tooling, verification, and migration handoff while preserving Next.js-managed rules.

## Verification record

Fresh checks use the official Node 24.21.0 runtime (download checksum verified), pnpm 10.26.2, and Go 1.26.6. The installed Homebrew Node 24 binary could not run because of a missing shared library; the isolated runtime avoids changing that installation. Earlier progress documents remain historical checkpoints.

| Check | Final result |
| --- | --- |
| `pnpm check:frontend-modernization` | Passed; removed stale reference to absent webpack source directory |
| `pnpm check:frontend-boundaries` | Passed: 3,262 source files; corrected eight shell imports to existing domain public APIs |
| `pnpm check:app-router-compliance` | Passed: 166 pages |
| `pnpm typecheck` | Passed |
| Frontend tests | Passed: `pnpm test --maxWorkers=4 --reporter=verbose`; 340 files, 2,288 passed, 5 skipped, 11 todo |
| `pnpm lint:ci` | Passed: zero errors, 196 warnings |
| `pnpm build` | Passed: production webpack compilation, TypeScript, route generation, and standalone packaging |
| Backend tests | Passed: `go test ./...` in `backend-src` |
| Browser smoke | Passed: local administrator Docker dashboard and global resource search. This pass does not claim live Kubernetes or standard-user coverage. |
| Release version checks | Passed: `bash scripts/check-release-version.test.sh` |
| Container supervisor regression | Passed: four tests via `node --test build/next-entrypoint.test.cjs` |
| Documentation links and whitespace | Passed: 104 local references across 11 documents; scoped `git diff --check` passed |

The pre-commit TypeScript command now invokes `pnpm typecheck` rather than looking for a removed root TypeScript configuration. Plugin support remains future planning only.

Previous release CI failed after the image printed its version: the launcher overwrote a successful backend exit with the signal status of the frontend it shut down. The launcher now preserves the first child's exit status; focused supervisor regression tests are included in CI. Both image architectures must still be executed before stable promotion.

## Final handoff

1. Both migration agents are finished; use the fresh integrated checks above for this release.
2. Review moved files with rename detection. Tracked deletions alone do not represent removed functionality because destination roots include new files.
3. Record check results and unresolved limitations, including workflows needing live Kubernetes.
4. Confirm deployment and image-version documentation against the intended release; this pass does not change release identity.
5. Rewrite the draft body if scope changes. Describe plugin support as a future plan.

## Extension system follow-up — October 16, 2026

This follow-up extends the experimental extension work already present in the
working tree. It adds a real persistent write-back example and permits a complete
set of approved example packages to share one isolated development build.

- Added `storage.read` and `storage.write` grants for extension-owned notes, with
  independent administrator selection and matching Go/package-validator policy.
- Added administrator-only storage endpoints bound to registration, package digest
  and approval revision. Text is bounded to 16 KiB UTF-8. Optimistic version checks
  reject concurrent overwrites; writes and metadata-only audit entries commit in
  the same datastore transaction. Management responses omit note contents so they
  cannot bypass the storage-read grant. Reupload retains notes while revoking approval;
  removal deletes the notes with the registration.
- Passed a host-owned storage facade to approved native page components and added
  the Persistent Notes example with load/save/reload, conflict recovery, and no
  browser-local persistence. Infrastructure mutation RPCs remain separate work.
- Extended the development controller with an exact multi-package descriptor set,
  per-package archive extraction and approval rechecks around compilation and
  source selection. All selection is limited to generated module namespaces.
- Corrected backend-only package validation so permission checks also run without
  a UI descriptor. Staging now normalizes known Next.js-generated development type
  imports in the candidate, preventing production builds from triggering a false
  protected-input mismatch. Added root translations to protected/staged inputs
  after isolated typechecking exposed a missing test setup dependency. The reviewed source itself is preserved.
- Built a native Go backend and extractor, packaged both UI examples, and exercised
  upload/approval and the real mTLS stack topology broker in a fresh temporary
  datastore. The test stack returned one network and one workload. Real HTTP
  write-back persisted a note and rejected a stale editor with HTTP 409.

Final integrated verification results are recorded after the candidate build and
browser checks below. Production artifact activation, managed executable startup,
and background UI-driven build orchestration remain future platform work; this
follow-up does not claim those controls are implemented.

The compiled-package lint gate subsequently caught six example-source errors that
were hidden by the normal examples exclusion. Fixed import grouping, promise
callback return values and local function declarations without relaxing lint.
The live App Router stack page also duplicated the domain view, bypassing the
extension action added there. It now renders the domain's `StackDetailsContent`,
keeping the existing route header and resource-access behavior. This integration
is included in the final candidate and browser checks.

Final build validation also established the builder's resource requirement: the
production webpack command needs a fixed 4 GiB V8 heap within the existing 6 GiB
container limit. The trusted validator supplies this setting only for `build`;
operator environment and package input cannot supply arbitrary Node options.
The image must be reprovisioned and pinned after this tooling change. A late
React Query notification in the Kubernetes stats test was fixed by owning,
cancelling and clearing its test clients and draining queued notifications before
jsdom teardown; the focused test passed five consecutive fresh runs. No unhandled
errors are ignored by the gate.

Browser and update-path review also tightened runtime behavior: topology HTTP
requests now bind the approved revision/source digest, and missing or stale
bindings fail before gRPC dispatch. The host copies and freezes the stack context
and serializes only its scoped input fields. Native approval queries always fetch
fresh authority on mount and fail closed offline. The stack drawer uses the
shared ref-forwarding trigger and restores keyboard focus on close. The reference
graph lets React Flow own measured visual nodes so its minimap can render, while
deletion stays disabled and keyboard descriptions reflect the read-only view.
Notes buttons use explicit theme colors, visible keyboard focus and 44-pixel touch
targets. These are part of the final reviewed package revisions.

### Fresh final verification — October 16, 2026

The complete two-package candidate passed the isolated gate with Node 24.21.0,
pnpm 10.26.2 and builder image
`sha256:ea872967285a0a754f34946117061bf91a6f43a6e4fa6b00acdc3ea895a0c5d7`.
Its standalone artifact digest is
`8df537ca9ad208efe7402f1fa94092292ef687cf7e8ebcb1041ca21f52500bfb`.
The original repository's generated registry remains empty; the development
controller selected modules in a disposable reviewed-source checkout.

| Check | Fresh result |
| --- | --- |
| Frontend modernization | Passed |
| Frontend boundaries | Passed, 3,293 source files |
| App Router compliance | Passed, 168 pages |
| Typecheck | Passed |
| Extension example tests | 3 files, 14 passed |
| Full frontend suite | 351 files; 2,353 passed, 5 skipped, 11 todo; no unhandled errors |
| Lint | Zero errors, 196 warnings |
| Production webpack and standalone packaging | Passed; webpack compiled in 75 seconds |
| Native extension tooling | 60 tests passed |
| Full backend suite | `go test -p 2 ./...` passed with Go 1.26.6 |
| Native extension HTTP race tests | Passed, including concurrent note writes and stale invocation binding |
| Service example | Native TCP mTLS tests passed; Linux amd64/arm64 binaries built and `--help` executed in containers |
| Supervisor | 4 tests passed |

Installed and launched the standalone console and Vessel 1.3.0 backend together in
the ignored `dist/native-extension-demo/` artifact. The packaged executable was
replaced using a fresh inode after macOS rejected an in-place executable overwrite;
the resulting binary passed signature verification and reported version 1.3.0.
No operator credential or TLS private key is bundled. The launcher keeps its
private datastore and credentials outside the artifact.

Fresh Chrome checks against that artifact covered the actual App Router stack
page, one-network/one-workload topology, two visible minimap nodes, zoom, the
attachment table and focus restoration after closing the drawer. Persistent
Notes saved version 3 through the real UI and retained its text after reload;
the earlier version survived backend replacement. Light/dark themes and a
375-pixel mobile viewport showed readable controls, 44-pixel note buttons and no
horizontal overflow. Reupload through the UI created revision 6, cleared approval,
blocked the native preview, and retained the saved note after explicit review.
The browser file chooser's tool path restriction required selecting the existing
server-downloaded archive as a browser File; the application upload form and its
normal POST handler performed the upload.

Live API checks rejected missing topology bindings with 400 and stale revisions
with 409. Revoking only `storage.write` rejected a save with 403 without changing
the note; the original approval was then restored. A standard user was denied
management and storage access. The separately approved metadata service read
environment 1 using its real mTLS identity and was denied environment 2.
Management responses continued to omit note contents. The browser reported an
unused Next.js CSS preload warning; no extension JavaScript exception occurred.

Runtime coverage is Docker standalone on this macOS ARM64 host. Live Kubernetes,
Swarm, Podman and Azure ACI checks were not performed. Production activation and
managed extension process orchestration remain roadmap items. The Go service is
an explicit manually launched client. This is a runnable development artifact,
not a production extension release service.

### Draft commit for the extension follow-up

`feat(extensions): add persistent notes and validate complete development package sets`

Add scoped, versioned extension-owned storage with transactional metadata audits
and a Persistent Notes example. Bind topology requests to current approval,
refresh native UI authority on mount, and connect stack actions to the live App
Router route. Validate complete package sets in an isolated builder, preserving
protected core inputs, and provide a manually launched mTLS metadata client.

Validation: all eight isolated frontend gates, the full Go suite, native HTTP race
tests, tooling tests, dual-architecture service smoke checks and live browser/API
checks above. Review this follow-up together with the pre-existing experimental
extension files; unrelated repository edits and historical migration scope are
not part of this draft. Build output, temporary credentials and private state
remain uncommitted.

## Go extension SDK follow-up — October 16, 2026

Added the independent `github.com/TheModCraft-TMC/Vessel-HQ/sdk/go` module
(`sdk/go`, package `extension`, Go 1.25 minimum). The public protobuf schema and
generated Go contract now live in this module; the host imports that same package
through a local module replacement until an SDK version is published. The
`vessel.extensions.v1` wire service and field numbers remain unchanged. The old
backend-local generated copy was removed rather than maintained in parallel.

The SDK owns certificate loading, TLS 1.3, server verification, strict
package-bound client URI checks, initial registration verification, a reusable
concurrent connection, idempotent close, bounded per-call deadlines, cancellation,
message limits and typed `GetRegistration`/`GetEnvironment` calls. Wrapped errors
preserve gRPC status codes. It caches no approval authority and cannot provision
grants or mint host delegation leases. The existing operator example now uses the
SDK, and a separate environment-configured example builds without the backend
module. The current service calls read metadata; administrator notes still use
their separate HTTP/UI facade.

Added `make test-extension-sdk`, `make generate-extension-proto` and
`make package-extension-sdk`. The source packager first builds the independent
module, allows only public source/module/doc/license files, and refuses to
overwrite an existing artifact. The generation script supports a temporary-output
`--check` using pinned Go generators. A new CI workflow configures Go 1.25/1.26 SDK
checks, Linux example builds, generated-contract checking and host integration.
The workflow was inspected locally; no remote CI execution is claimed.

Fresh verification for this follow-up:

- SDK race tests passed on Go 1.25.5 and Go 1.26.6; SDK and affected host packages
  also passed `go vet`. Tests cover real TCP/mTLS, concurrent reuse, fresh
  registration, live revocation, caller/default deadlines, cancellation, invalid
  client identities, foreign CA/server names, response limits and scope mismatch.
- The actual host/SDK integration test passed with the race detector. It checks
  approved access, out-of-scope denial, revocation on an established connection,
  audit failure withholding data, and disabled-registration connection rejection.
- All affected extension packages and the full backend `go test -p 2 ./...` suite
  passed. Some unchanged packages used Go's test cache. Live Kubernetes was not
  configured. No frontend implementation changed in this SDK follow-up, so the
  earlier frontend build is not represented as a newly rerun check.
- Both the SDK-only executable and migrated operator client read environment 1
  from the already running Vessel broker over mTLS. Environment 2 returned
  `PermissionDenied`. A separate Go project consumed an extracted SDK source
  archive with only an SDK local replacement and read the same live metadata.
- Independent runtime dependency inspection found no Portainer backend, Docker
  or Kubernetes packages. Linux amd64/arm64 SDK-only examples built and executed
  `--help` successfully in read-only containers with no network or capabilities.
- Regenerated contract comparison, shell syntax, source archive content checks,
  documentation paths and whitespace checks passed. The machine's inherited
  GOROOT pointed at Go 1.26 while its base `go` was 1.25; test commands cleared
  that local override and selected the intended toolchain explicitly.

The local SDK source artifact is `dist/vessel-extension-go-sdk-dev.tar.gz`;
its SHA-256 is `8d7707be44d0518e956d15ca1abd4456524d8af2fa846909969c25f2a48c5201`.
Build output remains ignored. No module was published or application release
identity changed. Managed startup, production credential issuance/rotation,
stable API compatibility policy and additional granted RPC families remain
explicit roadmap work.

Draft commit for this follow-up:

`feat(extensions): provide an independent Go gRPC SDK`

Extract the shared extension contract into a standalone Go module and provide a
verified mTLS client with bounded, typed metadata calls. Migrate the operator
example, add a standalone consumer, source packaging and SDK/host CI checks.
Validation: dual-toolchain race tests, full backend suite, host authorization
integration, real broker reads/denial, isolated consumer and Linux example smoke
checks described above. Preserve the unrelated pre-existing working-tree changes.

### Extension drawer, Docker traffic and Go service write-back — 2026-10-16 follow-up

This follow-up implements the maintainer-authorized extension work; previous
entries describe historical checks, not this follow-up's final verification.

The normal development console at `http://localhost:8999` now selects the two
approved compiled examples. Stack network overview opens an inline drawer inside
an Extensions container above Stack details. Its topology, configured Traefik
label paths, filtered configuration and user-started live Compose RX/TX stream
use package/revision-bound, stack-scoped host operations. Stream samples recheck
current access every five seconds, expire after one minute and cancel on close.
The stream forbids proxy transformations so gzip cannot buffer live samples.
Docker does not supply HTTP request counts, route latency, Traefik static/file
configuration or resolved runtime state. Swarm task counter collection remains
future work.

The independent Go SDK adds TLS-authenticated Unix transport and typed note
read/write calls. Service storage grants are independent of native UI trust and
user sessions. Version comparisons prevent silent overwrites; writes and
metadata-only audit commit together. Infrastructure mutation RPCs, generic
extension service routing, managed executable startup and production certificate
issuance/rotation remain roadmap work. No stable SDK module was published.

Fresh verification of the selected frontend passed modernization, boundaries
(3,294 source files), App Router (168 pages), typecheck, extension tests (17),
frontend tests (2,356 passed; 5 skipped; 11 todo), lint (0 errors; 196 warnings),
and the isolated webpack production build. Full backend tests, focused host/RPC/
topology race tests, SDK race tests/vet and generated-contract comparison passed.
The final stream-header regression additionally passed handler race tests.
After installing it, both direct and frontend-proxied streams delivered their
first sample in under 50 ms without compression, and the proxy check confirmed
increasing real counters across two samples.

The existing local backend data was backed up before the development install.
Its replacement retains the same mounts, data and public ports, adding only a
private shared-volume Unix gateway; the original stopped container is retained
for rollback. On restart the private listener correctly refused a stale socket;
after stopping the sole owner, the development socket was removed and startup
verified. Automatic crash recovery remains future lifecycle work. The demo stack
publishes no ports. Real socket reads returned one
configured router, two workloads and increasing counters across two samples.
A read-only SDK container with networking disabled wrote note version 1; the
normal UI loaded it, saved version 2, and the SDK read version 2. The development
mTLS credentials expire after 24 hours and are excluded from source artifacts.

Browser checks cover the normal console's inline drawer, graph and minimap,
Traefik label configuration and the note round-trip. A 375px dark viewport had
no document or drawer horizontal overflow. The final browser stream displayed
nonzero RX/TX rates; Stop cancelled the session, Escape closed the drawer and
restored trigger focus, and the final navigation had no console errors. No live
Kubernetes, Podman, Azure ACI
or Swarm task-counter environment was exercised. Remote CI is configured but
was not executed locally.

The final development SDK archive is `dist/vessel-extension-go-sdk-dev.tar.gz`
with SHA-256 `bc7e0deda33a5610fa8d86a3061e9ad48896729ebe74fb358eca2b3e0ab8ddba`.
Approved example archives, the frontend selection receipt and verification
artifacts are under ignored `dist/native-extension-development/` and
`dist/native-extension-sdk-verification/`; no credentials are included.

Draft commit for this follow-up:

`feat(extensions): add inline traffic views and Unix SDK note writes`


### Extension topology presentation and experimental prerelease — 2026-10-16

The extension card is now specific to each approved extension, between Stack
Details and Containers/Services, using the same row/column alignment as neighboring
stack cards. It has no global Extensions wrapper. Traffic flow uses React Flow
with branching entrypoint/router/service/workload device nodes, measured aggregate
workload rates, activity links and a device inspector. Unresolved external service
references do not invent workload destinations. The network and traffic canvases
follow the console’s light, dark and high-contrast theme selection; reduced-motion
preferences stop link animation.

The maintainer explicitly authorized a feature branch and GitHub prerelease.
Application identity is `1.3.1-beta.1`; SDK distribution uses the independent
`sdk/go/v0.1.0-beta.1` module tag. API/datastore compatibility remains 2.45.0.
The [release guide](../releases/native-extensions-prerelease.md) describes the
experimental distribution and production limitations. An independent
[upstream review](../security/upstream-2026-10-16.md) verified an inherited
resource-control team-authorization gap; the focused predicate correction and
regression preserve Vessel’s read-only sharing behavior. Both Go modules use
patched gRPC 1.83.2 for the fragmented-DATA transport vulnerability. Remaining
inherited security gaps are recorded explicitly and are not claimed fixed.

The current SDK source archive is
`dist/native-extension-development/vessel-extension-go-sdk-v0.1.0-beta.1.tar.gz`,
SHA-256 `28c6ffe8b4c65b4c5ec1277b73135e6336a10a68ea58684fc3f75006133a58eb`.
It passed an independent extracted-module build with Go 1.25.5; SDK race tests
and vet passed on Go 1.25.5 and 1.26.6 after the dependency update. Local UI/backend verification is recorded below; publication is gated by the
separate tagged workflow.

Fresh prerelease checks: frontend modernization, boundaries (3,299 files), App
Router compliance (168 pages), typecheck, 22 extension tests, 2,356 frontend tests
across 351 files (5 skipped, 11 todo), and lint (0 errors, 196 warnings) passed.
After the gRPC and resource-control changes, the full backend suite passed,
including 151 packages with tests; the SDK/host and affected authorization race
checks passed. The isolated production build passed with artifact digest
`e31b27dfeabfb5e3b35513c593bbdc1e5f11ba6eff9d8a477d4ec9a85a20919d`.
Final normal-console browser checks verified desktop/mobile refitting, 30px device
icons, theme switching, real workload rates, an active measured link, the route
inspector and preservation of manual zoom across live samples. No console errors
were reported. The host card’s header Escape regression was then fixed and proven
by a failing-before/passing-after regression; all 16 focused tests, typecheck and
lint passed, and the normal browser confirmed closing/restored trigger focus.
The tagged workflow rebuilds and runs every required gate on that final host
change; the earlier local artifact is not claimed to contain the header fix.
Publication results are verified separately after that workflow completes.
