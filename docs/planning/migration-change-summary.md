# Migration change summary and release commit message

Status: preparing `1.3.2`, updated October 31, 2026. The experimental extensions originated in `1.3.1-beta.1`; the upstream API/datastore baseline remains `2.45.0`. No `1.3.2` publication or deployment is claimed.

The October 16 records below cover beta application/SDK publication, Docker Hub mirroring, independent SDK CI, frontend validation without publication, and an isolated Docker host smoke check. These are dated verification results, not checks rerun by this documentation refresh. SDK authoring now lives in an independent workspace while Vessel consumes the published immutable beta.1 module. Managed extension execution, production activation and rollback remain future work.

## Release preparation — October 31, 2026

- Advance only `RELEASE_VERSION` to the next unused local patch, `1.3.2`;
  preserve package/API/datastore compatibility version `2.45.0`.
- Repair the live audit gate's interpretation of pnpm 10 JSON status 1. Complete
  low-only reports pass; moderate/higher findings, incomplete reports, killed
  scans and unexpected process failures still fail. Regression tests invoke
  the actual wrapper and verify retained report contents.
- The fresh scan exposed new follow-redirects, glob and minimatch advisories.
  Resolve them to 1.16.2, 14.0.2 (modern glob consumers) and 11.0.1 respectively.
  Keep glob 7's callback interface through the documented maintained-matcher
  CommonJS adapter and parsed-segment bridge. No advisory is excluded.
- Add [draft release notes](../releases/1.3.2.md) and the
  [current verification record](../security/release-readiness-1.3.2.md).
  This section describes the release-preparation patch; prior sections below
  describe already committed work included in the release branch.

## Audit continuation — October 29, 2026

The [current remediation and verification ledger](../security/audit-follow-up-2026-10-29.md)
records local fixes for the October 28 audit, generated API changes, dependency
updates, live npm advisory CI and the remaining Go maintenance decision. October
23 PR #245 checks were read back as successful; they do not validate this new
uncommitted scope. README and pre-existing Next environment-file edits are
preserved. No release identity, upstream baseline or production resource changed.

## Current GitHub issue work — October 23, 2026

- #243: new standalone [Vessel Code Mode adapter](../../tools/vessel-mcp/README.md)
  with connected MCP tool discovery, selected schema-to-TypeScript declarations,
  async JS/TS execution, host-side authorization and credential isolation,
  encrypted portable approval continuations, one-use resume, retained resource
  budgets, agent instructions, CI and offline benchmarks. It is not deployed or
  automatically enabled in Vessel. No pre-existing agent loop was found.
- #244: [OpenTofu/Pulumi evaluation](iac-integration-evaluation.md) recommends
  OpenTofu-first infrastructure projects using isolated runners and exact-plan
  approval, with Pulumi behind a shared job contract. Provisioning remains future
  work, not an enabled feature.
- #235: the integration harness accepts artifacts only below an independently
  operator-configured root, opens through directory descriptors without following
  replacement links, rejects nonregular files and keeps the private ELF snapshot.
  External build roots remain supported through `VESSEL_SMOKE_ARTIFACT_ROOT`.
  All 46 harness tests passed; remote Sonar reanalysis is still required.
- #236–#240: five intentional privileged bootstrap cases were reviewed against
  their source/rationale and recorded Accepted/WONTFIX in Sonar. API readback
  confirmed all five. Their GitHub issues were closed as not planned through the
  existing authenticated CLI after the connector refused write access. Root
  startup was preserved; no false-positive classifications, source exclusions,
  quality-gate configuration changes or comments were added. See the
  [review record](../security/sonar-root-review.md#october-23-2026--current-issue-dispositions).

## UI alignment and mobile work — October 23, 2026

- Visually inspected 22 route patterns on deployed `1.3.1` and inventoried all
  168 page files. The [audit coverage](ui-alignment-audit-2026-10-23.md) records
  remaining live inspections; this is not a completed all-page production audit.
- Aligned registry cards using `PageContent`, removed account/activity double
  insets, repaired environment/registry table padding, and styled the shared
  SegmentedControl with accessible radiogroup semantics.
- Corrected fixed footer offsets to the active 280px/64px sidebar and zero on
  phones, added phone action wrapping and reserved content space, and wrapped
  table toolbars at the shell breakpoint. Corrected the trailing data-cell
  padding selector.
- Mobile navigation now uses the existing Radix dialog primitive for modal
  focus containment, outside dismissal, Escape/close, focus restoration and
  route-selection dismissal. The desktop sidebar behavior is retained.
- Actual shared-component browser checks: 320px/390px phones and 1440px desktop
  footer geometry, a 320px datatable, long resource heading, themed radio
  selection and a 320px mobile navigation drawer. Shift+Tab stayed inside the
  drawer; Escape closed it and focused the expand control. Local fixtures are
  not relabeled as authenticated production route coverage.
- The browser extension explicitly denied the deployed Vessel origin through a
  saved permission setting. The user was asked to enable site access; no
  alternate surface or indirect script is used to bypass that denial. No
  deployment, production form submission or production resource change occurred.
- Fresh final checks passed with Node `24.21.0`: modernization, boundaries,
  App Router compliance (168 pages), typecheck, all 368 frontend test files
  (2,505 passed, 5 skipped, 11 todo), lint (0 errors, 194 existing warnings),
  webpack production build and standalone packaging. The final full test run
  used four workers after default concurrency caused heavy local contention.
- Adapter verification: 17 Node tests passed, including actual MCP stdio
  discovery/execution and externally approved restart/resume; source lint passed,
  dependency audit found no known vulnerabilities, and 3/3 deterministic benchmark
  workflows passed. See the [measured benchmark](code-mode-benchmark-2026-10-23.md)
  for token counts, actual/synthetic scope and explicit latency limitations.
- Documentation path checks passed for 430 local links and all 168 route-source
  paths; whitespace checks passed. `RELEASE_VERSION` is `1.3.1`; the malformed
  local prefix was repaired. The user's unrelated README edit is preserved.

## Local build recovery — October 23, 2026

- Reproduced a webpack failure caused by missing `@tailwindcss/postcss` in the
  local installation, despite its existing manifest and lockfile entries.
  Restored dependencies with `pnpm install --frozen-lockfile`; no dependency
  versions or build configuration changed.
- Used the official Node.js `24.21.0` macOS ARM64 archive after verifying its
  SHA-256 against the published checksum. The shell defaults to Node `25.9.0`,
  and Homebrew's Node 24 still cannot start because its simdjson library is
  missing. The temporary runtime does not repair the Homebrew installation.
- Fresh verification passed: modernization, architecture boundaries (3,316
  source files), App Router compliance (168 pages), standalone typecheck, lint
  (0 errors, 194 warnings), and the production webpack build with standalone
  packaging. The packaged server returned HTTP 200 for `/login` on a temporary
  localhost port. All 367 frontend test files passed: 2,502 tests passed,
  5 skipped and 11 todo. No authenticated browser workflow, publication or
  deployment was performed.
- Next.js regenerated `next-env.d.ts` with production type paths during the
  build. Run standalone typechecking after a build finishes to avoid racing
  regeneration of `.next/types`.

## Develop integration — October 22, 2026

- Merged the native extension prerelease branch into the current development
  history, retaining the `1.3.1` release identity, dependency updates, security
  fixes and existing CI guards. Beta publication and host smoke records below
  remain dated historical evidence.
- Adapted extension topology and one-shot traffic reads to the current Moby SDK,
  including caller cancellation during client creation. A real HTTP adapter test
  verifies topology mapping and non-streaming, one-shot counters.
- Kept stack detail composition in its App Router page and integrated extension
  actions there while preserving current access-control behavior.
- Included the pending documentation refresh, stats test query cleanup and staged
  obsolete screenshot removal. Generated Next.js environment changes stay local.
- Fresh verification: frontend architecture guards and typecheck, all 19 extension
  example tests, release/mirror script tests, affected Go extension packages and
  the HTTP package tree passed. Changed Markdown local paths and whitespace passed.
  Lint and the production build also passed; the full frontend test suite is
  still running.
- Local frontend checks use Node `25.9.0`; the installed required Node `24.21.0`
  cannot start because its Homebrew simdjson library is missing. No browser smoke,
  image publication or deployment was performed for this integration.

## Documentation refresh — October 17, 2026

- Reconciled current roadmap decisions, feature catalog and documentation entry points with the October 16 implementation/publication records.
- Distinguished the published beta.1 SDK from future releases under the independent workspace's identity; preserved immutable release descriptions and historical verification.
- Updated verification commands for the Vessel image repository, backend working directory and frontend-only CI dispatch.
- Gemini reviewed an explicitly approved reduced brief; its draft was checked against local source and corrected before applying. No application code, release assets or deployments changed.
- Documentation verification: local Markdown link/path checks and `git diff --check` passed for the changed documents. Application tests, builds and remote state checks were not rerun for this documentation-only scope.

Draft commit message for this refresh:

```text
docs: refresh beta status, SDK ownership and verification guidance
```

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

## GitHub issue remediation — October 21, 2026

Separate from the historical migration/release scope below. This work starts at
`5b175344b` on `develop` and covers the 226 issues reported at the start of the
fix: #233 and 225 synchronized SonarCloud findings. It does not change
`RELEASE_VERSION`, the upstream API compatibility baseline, or publish a release.

- Restore image usage filtering: Radix portals must not inherit Bootstrap's
  hidden/absolutely positioned dropdown behavior, and the usage filter must
  read mutable TanStack state without React Compiler caching. Add a
  compiler-enabled Used/Unused/both/clear regression and handle removal prompt
  rejections. Production browser checks against a disposable Docker environment
  distinguish five used images from 36 unused images, verify menu placement,
  and preserve a cleared filter after reload.
- Replace upstream/Business Edition bug-report questions and support links with
  Vessel HQ version, deployment, platform, and sanitized reproduction fields.
  Align the package's repository and bug-tracker URLs.
- Resolve the remaining frontend findings: authorization fallthrough in placement
  details, clipboard success/failure handling, awaited/caught UI operations,
  empty-list/default-object behavior, slow regexes, explicit comparators,
  stable IDs, numeric helpers, semantic table headers, and deterministic stories.
- Harden backend TLS 1.2 suites, preserve caller context/deadline contracts,
  bind the agent signing proxy to loopback, handle malformed OAuth responses,
  and test existing Authentik identity/group sources. Isolate the global HTTP
  logger test so the new parallel shutdown regression is race-free.
- Remove unverified toolkit installers/archives in favor of digest-pinned
  multi-platform Node/Go images, verify the Docker repository key, scope apt
  trust, pin Actions to commit SHAs, and add non-publishing PR validation.
  Keep intentional host-socket/data ownership policies narrowly documented.
- Fix generated SSE cancellation through a pnpm patch to the generator template,
  regenerate the API client, and test rejected cleanup promises. Generated code
  remains analyzed; no authored/generated source tree is excluded from Sonar.
- [Issue-by-issue ledger](github-issue-remediation.md): 200 source-fix dispositions
  and 26 reviewed intentional compatibility cases. See the
  [backend security review](../../backend-src/SECURITY_REVIEWS.md) for transport,
  cookie, OAuth, and historical backup reasoning; these are not blanket security
  exceptions or a claim that a remote scan already cleared the issues.
- Fresh combined local checks: architecture guards (3,274 source files; 166
  routes; 103 CSS Module imports), typecheck, lint (zero errors, 194 warnings),
  full frontend suite (353 files; 2,351 passed, five skipped, 11 todo), production
  webpack build/standalone packaging, and full backend suite (210 packages) pass.
  The affected backend race suite passes, including five repetitions of HTTP
  shutdown/logger tests. Local lint excluded only nested, ignored review clones;
  no source guard or committed ignore rule was loosened.
- Toolkit AMD64/ARM64 builds and tool execution, Dockerfile checks, actionlint,
  ShellCheck, release-version/entrypoint/build-script tests, frozen dependency
  installation, issue-form YAML, ledger links, and whitespace checks pass.
  No live Kubernetes, Swarm, Podman, Azure ACI, external Edge tunnel, or real OAuth
  provider was available; corresponding fixtures/unit tests are not live coverage.

### Independent remediation review verification

- Restore keyboard access to the shared multi-select filter with registered
  Radix checkbox items; keep multi-selection open and restore trigger focus on
  Escape. A compiler-enabled regression covers keyboard selection and navigation.
- Remove the unused Node-image UID/GID 1000 account before the toolkit creates
  the host identity. Both ARM64 and AMD64 images build and their real entrypoint
  runs as requested UID/GID 1000 with Go 1.26.6, Node 24.22.1 and pnpm 10.26.2.
- Correct the Chisel review rationale: the client connects through loopback, but
  existing per-agent reverse forwards can listen on all interfaces. Preserve the
  agent wire contract and document required network restrictions.
- Preserve the historical detached Compose teardown lifetime while retaining
  caller context values; a browser disconnect or Next.js proxy timeout must not
  interrupt a long-running stack stop/delete.
- Fix variable-width Docker timestamp prefixes in both structured-log helper
  owners. A bounded shared splitter replaces fixed-width slicing; preserve the
  original timestamp and separator, and keep malformed/unprefixed input raw.
  Scope API-generation formatting to generated output, avoiding unrelated churn.
- Fresh checks pass: architecture guards (3274 files, 166 routes), typecheck,
  frontend tests (353 files, 2352 passed, 5 skipped, 11 todo), lint (no errors),
  production webpack/standalone build, 12 binary-build/router-script tests, and
  nine affected backend race-test packages. Generator regeneration plus scoped
  formatting produces no generated-client drift with the installed patch.
- Independent production-browser checks use isolated controlled API fixtures,
  not private infrastructure: reproduce the original keyboard failure, verify
  Used/Unused/both/clear and Escape focus restoration after the fix, and inspect
  filter positioning, build-info definitions and team row headers at 390px.
  Live Edge/Swarm/OAuth-provider workflows, remote Sonar analysis and GitHub-hosted
  PR CI are not claimed by these checks.

### Final combined local verification after review

Both GPT-6.1 Sol and Claude Opus 5.5 reviewed the whole change in two rounds.
The second round found no new introduced defect. A small pre-existing structured
log copy/download accumulator defect noted in that review was also corrected:
plain text now matches the rendered spans, with regressions in both helper owners.

Fresh combined results, superseding the earlier intermediate counts above:

- Architecture guards: 3,277 source files, 166 routes, 103 CSS Module imports.
- Typecheck and uncached lint pass: zero errors, 194 warnings.
- Full frontend suite: 356 files; 2,491 passed, five skipped, 11 todo.
- Full backend suite: 210 packages; affected-package race checks pass, including
  Compose/Swarm CLI packages and repeated HTTP shutdown/logger checks.
- Production webpack compilation and standalone packaging pass. The final client
  ran from `dist/next/web-src/server.js`; the rebuilt ARM64 backend reports 1.3.1.
- Toolkit builds and real UID/GID 1000 entrypoint/tool checks pass on AMD64/ARM64.
  Generator regeneration has zero drift; all 16 binary-build/router/entrypoint
  tests and release-version checks pass. Workflow/issue-form YAML, ledger links,
  frozen dependency installation and whitespace checks pass.
- Real Docker browser checks: Used/Unused/both/clear, keyboard navigation,
  multi-selection, Escape focus return, clear-after-reload, and timestamped
  structured logs from a disposable container. Copied text matches all ten
  rendered lines with each timestamp appearing once (clipboard-write spy, no
  host clipboard mutation). Isolated production-client fixtures also cover
  short timestamp fractions and 390px layouts.
- Remote SonarCloud and GitHub PR CI results are reported by the PR checks rather
  than inferred from these local results. Live external orchestration/provider
  coverage remains limited as described above. No release/image was published,
  and no Portler/Workler configuration or runtime files are included.

### PR analysis correction and access requirement

PR #234's first remote scan reported 19% duplication and a new toolkit-root
finding. Consolidate the three app formatter entry points onto the canonical
shared implementation and replace duplicate app test bodies with an export
identity contract. The shared regression cases and stream tests remain intact;
no duplication exclusion or quality-gate threshold was added. The integrated
full suite now passes 355 files with 2,424 tests, five skipped and 11 todo.
The decrease is 68 duplicate cases removed and one ownership contract added.
All three architecture guards, typecheck, uncached lint (zero errors, 192
warnings), and the production build/standalone packaging pass after consolidation.
The hosted Linux-image pipeline also passed its first PR revision, including
AMD64/ARM64 execution checks; the latest PR checks remain authoritative. The
next Sonar scan at `c551f9803` confirms 0.6% new-code duplication (3% limit),
reliability/maintainability A and 100% reviewed hotspots; only the toolkit-root
case still blocks its security rating.

A final integration check found that scheduled/push issue synchronization could
undo PR issue closures while Sonar still reported the previous source revision.
Require a completed Sonar `develop` analysis matching the live GitHub head,
with read-only polling bounded to ten minutes. Pin that revision through
planning, check it again before applying a plan, and guard each mutation against
a newer push. This does not suppress fresh findings or change valid reopening,
closure, or human-note preservation. Twenty-four Python tests, 19 Node tooling
tests and release-version checks pass. A live read-only smoke at `5b175344b`
verifies matching revisions and a dry-run plan with mutation methods forbidden.
No cross-service atomicity is claimed for an already in-flight individual write.

Round-three review found a separate retry-layer gap: a rate-limited POST/PATCH
could sleep and retry after the branch advanced, outside the per-write guard.
Fail closed on write errors rather than retrying an old plan; retain retries for
safe GET requests. The next scheduled run resolves freshness and deduplicates
any committed creations before planning again. A real loopback HTTP 429
reproduction confirmed the stale second attempt before the fix; regression
coverage checks POST/PATCH 403/429/500 failures and preserved GET retries.
All 26 Python tests pass after this review fix. The manager independently
repeats the loopback before/after proof: the old code attempts revisions `a`
and `b`; the fixed code attempts only `a`, with no backoff or stale retry.

Both mandated reviewers complete a third whole-scope review of all 222 paths
through `d28be6c4b` and the retry fix. Opus independently repeats the full 2,424-test
frontend suite, all 210 Go packages, typecheck, guards, lint and production build.
Both repeat affected Go race checks and production-browser keyboard/filter/
390px checks; Sol also verifies timestamped logs and copied text. There is no
further introduced defect established in this round.

The other clear pre-existing finding is fixed separately: parse `Retry-After`
HTTP-date values as well as seconds, treating legacy timezone-less HTTP dates
as UTC and retaining the conservative 60-second minimum for missing, invalid,
expired or short values. All 28 Python tests pass, including date-format and
real request-layer retry cases. Writes still never retry. This small protocol
fix does not change the backend or frontend source tested by both reviewers.

The single Copilot review found a remaining quadratic cron-validation path:
the unanchored regex could restart after each comma in a malformed numeric
list. Extend the bounded lookbehind to reject a preceding digit-comma pair,
not just a preceding digit. Both Edge job create/update forms share the fixed
schema. Sixteen focused cases pass, including 50,000-element malformed and
valid lists; 100,000 deterministic differential samples preserve acceptance.
The bot's 16,000-element reproduction drops from roughly 550 ms to below 1 ms
on the local Node 24 check. No input-length cutoff or scanner exclusion is used.
After this fix, the full frontend suite passes 355 files / 2,428 tests (five
skipped, 11 todo); guards, typecheck, uncached lint (zero errors, 192 warnings)
and production packaging pass again. The rebuilt production client rejects a
100,002-character malformed list in 46 ms on create and 33 ms on update, then
accepts a valid rule again. Isolated API fixtures record no attempted mutations
and no page errors. Both forms were exercised, not just the regex in isolation.

**Not done yet: the intentional Docker root findings require an authorized
SonarCloud review.** Automatic Analysis ignores the attempted multicriteria
configuration, and Dockerfiles do not support `NOSONAR`. Remove the ineffective
ignore block rather than claiming it works. The [issue ledger](github-issue-remediation.md#sonarcloud-review-access)
lists the five default-branch cases and the PR counterpart for an authorized
reviewer. No SonarCloud review credential is available to this task; the PR
must not be described as passing that gate until the service records the review.

## Historical extended remediation checkpoint — October 22, 2026

Superseded for current verification by the integrated checkpoint below. The
remaining-work statements here describe that earlier implementation point.

The maintainer authorized the remaining dependency and live-platform work in the
same PR, with at most ten review rounds. This checkpoint is separate from the
226-issue verification above and is **not final combined verification**. No merge,
image publication, additional PR, or remote finding dismissal has occurred.

- Eliminate all **61 supplied npm vulnerable ranges**, including unpatched
  Bootstrap JavaScript, braces, and sprintf-js chains. Retain only licensed,
  provenance-pinned Bootstrap presentation assets; migrate actual parent chains
  to Tailwind 4, Storybook's Next.js/Vite builder, and maintained OpenAPI validation.
  Preserve the existing Node/pnpm baseline, generator version/patches, Zustand
  persistence contract, release identity, and API/datastore compatibility.
  [Inventory and rationale](../security/dependency-npm-remediation.md).
- Independent integrated npm checks pass: frozen install, fresh audit with **zero
  vulnerabilities at every severity**, all 61 original advisory IDs/ranges checked,
  15 dependency-security regressions, all **40 Node tooling tests**, architecture
  guards (3,278 source files, 166 routes, 103 CSS Module imports), typecheck,
  uncached lint (zero errors, 192 warnings), **355 files / 2,428 frontend tests**
  (five skipped, 11 todo), production webpack/standalone build, and Storybook build.
  These results certify that frontend dependency checkpoint, not later API/UI edits.
- Migrate direct Docker imports to the real split Moby API/client modules and
  Compose 5; remove containerd v1 and patch affected Go dependencies. This fixes
  **21 of the 26 original Go ranges** at the current checkpoint. Five selected
  no-patch transitive findings remain explicitly recorded, not renamed or hidden.
  A fresh vulnerability scan also finds standard-library issues requiring the
  approved Go **1.26.10** security patch. Further migration/toolchain work is not
  represented as complete. See [backend dependency evidence](../../backend-src/DEPENDENCY_SECURITY.md).
- Correct build metadata queries for the actual SDK/Compose modules and extend
  the existing packaging fixture rather than keeping a second test harness.
  Regenerate frontend contracts from the updated backend schemas; typecheck and
  repeated generation pass with identical bytes across all 16 generated files.
  A new regression exposes an existing null-warning mismatch in the generated
  service-update validator; its backend schema fix is not done yet at this checkpoint.
- Add a manual-only, six-case Sonar review path with authenticated identity,
  exact finding/scope checks, reviewed-source hashes, authorization preflight,
  deduplicated audit comments, and non-retried writes. All **47 Sonar helper/sync
  unit tests** pass. No remote review is claimed; an authorized Sonar user token
  is still required. [Operator runbook](../security/sonar-root-review.md).
- Add a reusable isolated platform harness with private executable snapshots,
  frontend symlink-escape rejection, bounded/owned resources, credential-safe
  failure reports, private kubeconfigs, and **30 safety/transport unit tests**.
  Candidate Go-artifact checks pass on real disposable Docker, Swarm, Linux Podman,
  kind Kubernetes, and an official Edge agent. Real Dex authorization, production
  frontend callback, identity/ACL, and session reload also pass, but stronger
  mobile hit testing exposes a search/sidebar-button overlap. That failure stays
  explicit while a scoped UI fix is implemented. Actual Swarm force update passes
  and confirms the wire response `Warnings: null`.
  [Scoped artifacts and coverage](../themodcraft/isolated-platform-verification.md).
- Expand non-publishing CI to run dependency/tooling regressions, Storybook, and
  platform-harness safety tests. Publication conditions, permissions, and triggers
  remain unchanged. Hosted CI and whole-scope review must be rerun for the final
  extended head; earlier green runs do not certify these new changes. Final exact
  Go/frontend artifact checks are not done yet. Azure ACI still requires authorized
  external account access; Dex coverage does not establish Authentik-specific
  group synchronization coverage.

## Extended remediation — integrated local verification, October 22, 2026

This is the fresh **pre-review local checkpoint**, not a claim that the PR's
Sonar gate or every dependency alert is resolved. The original 226-issue scope
remains separate from the authorized expanded work. Nothing was merged,
published, dismissed, or submitted as an additional PR.

- **82 of the 87 supplied dependency ranges are fixed or removed:** all 61 npm
  ranges and 21 of 26 Go ranges. Frozen installation, the exact npm advisory
  inventory, and a fresh npm audit pass with zero vulnerabilities at every
  severity. Five original selected Go ranges remain genuinely unresolved.
- Update the real toolchain and verified toolkit image to **Go 1.26.10** within
  the existing minor line. Fresh `govulncheck` has **14 finding records / six
  advisory IDs / zero standard-library finding records**; this is not a clean
  scan. Preserve release **1.3.1**, API/datastore **2.45.0**, Node 24, and pnpm
  **10.26.2**. [Exact Go evidence and fork decision](../../backend-src/DEPENDENCY_SECURITY.md).
- Correct slow/recovered engine negotiation using only public SDK APIs, retaining
  API 1.24/1.39, Podman 1.41, modern 1.54 and maximum-version capping. The actual
  old/new SDK loopback reproduction now succeeds after the same 5.2-second
  first-probe delay. Bound default local construction, preserve explicit-zero
  timeout and existing detached/background operation semantics, and propagate
  image-status construction errors instead of losing them or dereferencing nil.
- Own the service-update response annotation, preserving real
  `{"Warnings":null}`, empty arrays and populated arrays. Five generated-validator
  regression cases pass. Blank/missing service identifiers fail validation before
  SDK access. A fresh backend generation and two frontend generations preserve
  **all 18 checked schema/client files byte-for-byte**; generated output is not
  hand-edited.
- Fix the independently reproduced mobile header overlap using available-width
  container queries, reserved pointer-target space and bounded account controls.
  Real production OAuth/session/mobile pointer checks pass, as do **56/56**
  responsive interaction cases. Extra-action cases are geometry tests, not a
  claim of a real Business Edition runtime. [Before/after evidence](../security/mobile-header-verification.md).

| Fresh local check | Result and scope |
| --- | --- |
| Frontend architecture / routes / CSS Modules | 3,280 source files; 166 routes; 103 imports pass |
| Typecheck and uncached lint | Pass; zero lint errors / 192 existing warnings |
| Full frontend suite | 357 files; **2,434 passed**, five skipped, 11 todo |
| Node tooling / Python safety | **40 Node tests**; **47 Sonar + 30 platform tests** pass |
| Production and Storybook | Both builds pass |
| Go 1.26.10 full suite | **210 packages** pass on the final implementation |
| Race coverage | All 38 changed package directories checked at the preceding checkpoint; all 23 SDK-affected packages rechecked on final implementation source `030beb74f` |
| Schema/client reproducibility | All 18 files unchanged; final backend schemas independently regenerated and validated twice |
| Exact-artifact live coverage | ARM64 Docker/Compose, nested Swarm/force update, real Podman/Compose, in-cluster kind Kubernetes, official Edge and real Dex/production-frontend OAuth all pass; zero cleanup failures |
| AMD64 execution | Final AMD64 backend executes under explicit Docker Desktop emulation; real Docker/container/log and Compose CRUD pass; zero cleanup failures. Not native AMD64 or a second all-platform claim |

The final live run uses ARM64 backend SHA256
`37b916219eebb167ee14f4ff9a5f638bd0c0b1962159f846d728bd6d6c83e320`
(source `030beb74f`, clean build), and integrated frontend build
`79qONiyWoTz44XGPmvyya`. Its raw exit is **2**, solely because the explicitly
requested ACI suite is account-gated, not passed. See the
[exact-artifact platform record](../themodcraft/isolated-platform-verification.md).
Earlier baseline/candidate runs are not relabeled as this final artifact.

**Not done yet:** the expanded whole-scope review and hosted CI still need to run
for this integrated head. Five selected Go ranges need an approved maintained
upstream/fork publication path; six intentional Sonar cases need authorized
review credentials; actual ACI needs an authorized nonproduction Azure account.
Dex does not establish external Authentik group-sync coverage, and Windows/npipe
runtime execution is not available on this host. The manual Sonar path is preview
by default, pins its reviewed sources, and has made no remote mutations.

### Fourth-round independent review — October 22, 2026

The independent review covered the full 692-path range from `5b175344b` to
`e97911a8f`, not only the latest follow-ups. Correct one remaining Tailwind 4
migration regression: removed `bg-opacity-10` utilities made collapse-button
hover backgrounds opaque. Use color alpha for the existing light, BE and dark
variants, with an actual-compiler regression verified failing before the fix.

Fresh reviewer checks pass: frozen install, zero-vulnerability npm audit, all
four frontend architecture/CSS guards, typecheck, uncached lint (zero errors,
192 existing warnings), 41 Node tooling tests, 47 Sonar and 30 platform Python
tests, the full frontend suite (357 files / 2,434 passed, five skipped, 11 todo),
and race checks for 23 backend package paths (19 tested; four contain no tests).
Frontend contract regeneration
preserves all 16 generated files byte-for-byte. The real old/new SDK slow-probe
reproduction succeeds in both cases after the same 5.2-second delay. An
independent selected-module/range comparison confirms 21/26 Go ranges fixed or
removed, with the same five legacy Docker/Distribution ranges unresolved.

The corrected production webpack/standalone build passes. Hands-on Playwright
uses this reviewer's frontend build `mEl8sjYQHVvbPFYROxOCx` with the exact ARM64
backend artifact recorded above, not a newly rebuilt backend. Real disposable
Docker images verify Used/Unused/both/clear, reload persistence, keyboard
selection, menu positioning and Escape focus. Browser-computed hover alpha is
0.1 in six theme/edition cases. At 390px, actual search, sidebar and user-menu
interactions work without header overlap. Raw and structured container logs
render correctly, and copied text exactly matches the rendered lines with each
nanosecond timestamp once (clipboard-write spy only). Owned fixture cleanup has
zero failures; no test configuration, credentials or browser output is committed.
These are scoped Docker/UI checks, not new live Swarm/Podman/Kubernetes/Edge/OAuth,
ACI, external Authentik group-sync or Windows/npipe coverage. Other reviewers'
follow-ups and hosted CI remain separate; no remote finding was mutated.

### Fourth-round findings applied and reverified — October 22, 2026

Both required models completed the whole-scope review. Clear findings are fixed,
not deferred as design choices: retain translucent collapse controls and the two
previously width-only borders, remove the duplicate SDK import, and preserve all
four legacy snapshot diagnostic fields through a public SDK response hook. The
hook only observes requested responses, uses bounded per-call capture, preserves
SDK transports/headers/status/error handling, and issues no additional request.
Top-level diagnostic values also survive incomplete/conflicting Engine details.
Real old/new SDK and TCP/TLS/agent/Unix/concurrency regressions pass.

The independently reproduced existing fresh-install roles defect is also fixed
in its own commit. Share canonical role definitions with the existing migration;
transactionally seed only missing reserved roles during actual datastore Init,
including current-version stores that will not rerun migrations. Preserve every
occupied role, custom authorization/priority and user/environment/group/registry
access policy. Real production-browser verification shows **130 permission
checkboxes**, creates custom role **ID 6**, and confirms width-only borders in
light/dark/high-contrast cases, without page errors or cleanup failures.

The new verifier findings are corrected: exclusive private retained outputs and
privately staged captures prevent report/screenshot symlink/hardlink clobber;
explicit OAuth identity checks cannot disappear under optimization or report a
false ACL success; optimized CLI execution is rejected. Strict symlink resolution
rejects cycles on actual Python 3.14 while retaining legitimate internally
missing package links. Compose status polling now obeys its original caller's
cancellation/deadline, including the polling delay; detached teardown is unchanged.
A separately observed one-second JWT test race is fixed without changing product
JWT behavior: test revocation with a valid lifetime and cache expiry independently,
with past/future/non-expiring entries and 30 repeated race runs.

Fresh parent checks pass after applying these changes:
- **357 frontend files / 2,434 passed**, five skipped, 11 todo; all guards (3,280
  source files, 166 routes, 103 imports), post-build typecheck, uncached lint
  (zero errors / 192 existing warnings), production and Storybook builds.
- **42 Node tests**, **47 Sonar + 44 platform Python tests** on host Python 3.9.6
  and actual pinned Python 3.14; unchanged frozen dependency inventory/audit.
- **210 Go packages** and race checks for **all 41 changed Go package directories**;
  module tidy unchanged. All **18 schema/client files** remain byte-identical
  after complete backend and repeated frontend regeneration.
- Clean parent implementation `61c04c693` ARM64 binary SHA256
  `d2d2a8e13a102c4cc24fd26e3649d4bca8115001704cbf4c638183467f0081ca`,
  paired with frontend build `22JZOmL_MM9jkH2reT29j`, passes the full six runnable
  real-platform suites again using the corrected verifier; zero cleanup failures.
  Raw exit **2** still records ACI's access gate, not an all-suites pass.
  The same clean implementation's AMD64 executable also passes real Docker/
  container/log and Compose CRUD under explicit emulation (not native hardware),
  with raw exit zero and zero cleanup failures.

The completed Sonar analysis for pushed head `cde139e4f` now has **two findings**:
intentional toolkit root bootstrap and the independently reviewed S8707 CLI-read
false positive. Reliability/maintainability are A, duplication **1.1%** and reviewed
hotspots **100%**; its security gate is **not green**. The separate six-root-case
manual manifest remains unchanged. No remote acceptance or blanket source
exclusion was used.
The refreshed hosted Linux build **39763954427** and Sonar helper test run
**39763954374** both pass on `cde139e4f`; publication, mutating sync and root review
remain correctly skipped. This does not turn the separate Sonar security gate
green. Fifth whole-scope review is in progress for the applied fixes.

The additional [real local Authentik proof](../security/authentik-local-verification.md)
now **passes all four fresh browser authorization-code/UserInfo/team-sync phases**
on the exact `61c04c693` backend, without a product change. The custom group claim
is absent from ID tokens and present in real UserInfo; regex mappings, preserved
leader/unmanaged memberships, stale managed-group removal, changed-group addition,
default-team fallback and standard-user admin denial all pass. No OOM or cleanup
failure occurs; no owned resources remain and host Swarm stays inactive. This
proves the actual backend Authentik path through a companion callback, not the
production frontend or an external deployment's policies. Five selected Go
ranges still require an approved maintained upstream/fork publication path;
ACI/Sonar/native Windows access limits remain.

## 1.3.1 dependency and CSS Module fix — October 21, 2026

Separate from the 1.3.0 scope below. Dependabot PR #230 merged major updates
(`bootstrap` 5, `uuid` 14, `yaml` 2, `vitest` 5) without CI, and the `develop`
image build failed on typecheck.

- `uuid` 14 has no default export or `uuid/v4` path: use the named `v4` export,
  drop `@types/uuid`, and give `SwitchField` a React `useId` ID. Webhook tests
  mock only `v4` so switch IDs do not count as webhook IDs.
- Keep `bootstrap` ^3.4.1 (CSS only, Bootstrap 3 markup), `yaml` ^1.10.3
  (patched 1.x), and `vitest`/`@vitest/coverage-v8` ^4.1.12 (patched 4.x).
- The former webpack build exported camelCase CSS Module aliases; Next.js does
  not. Since the migration, 48 reads in 21 files, such as `styles.copyButton`
  for `.copy-button`, were `undefined`. Rename those classes to camelCase,
  remove the dead `styles.check` read, and add
  `scripts/check-css-module-classes.mjs` to `lint:ci`.
- Fresh local results: architecture guards (3,263 source files; 166 routes;
  102 CSS Module imports), typecheck, and lint (zero errors in repository
  source) passed. Full suite: 341 files, 2,293 passed, five skipped, 11 todo.
  `go test ./...` passed. Release context and an ARM64 image built; the image
  ran `--version`. Browser check on that image: switches toggle, webhook URLs
  are generated, the copy tick stays hidden until clicked, and sort icons get
  their classes. No AMD64 local run, and no Kubernetes, Swarm, Podman, or
  Azure ACI verification.
- Review fixes: the CSS Module guard resolves every tsconfig alias, checks
  namespace imports, reports unresolvable imports, ignores shadowed `styles`
  variables and declaration values, and has CLI fixture tests in `lint:ci`.
  The release guide now points at 1.3.1. Pinning Bootstrap 3.4.1 reopens two
  JavaScript-only advisories (GHSA-vxmc-5x29-h64v, GHSA-q58r-hwc8-rm9j); the
  console loads only the stylesheet. The roadmap records replacing Bootstrap 3
  and the separate YAML/Vitest major upgrades.
- Include Dependabot PR #231: `sanitize-html` ^2.18.0 (resolves 2.18.1, three
  XSS advisories) and `vite` ^8.1.6 (resolves 8.3.5). Typecheck, the full suite
  (341 files), and a fresh ARM64 release image (`--version` 1.3.1) passed after
  the bump.

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
| App Router | Console layouts and Docker, Kubernetes, Azure, administration, and delivery routes reference migrated owners | `web-src/app/`; [route-index generator](../../scripts/index-app-router-pages.mjs), run with `pnpm index:app-router-pages` |
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

## Round-five findings applied and fresh verification (2026-10-22)

Both required independent whole-scope reviews completed against the original
`5b175344be4a37e01a3adb2d859cf05a1d54c4e8` base, including the added Authentik
evidence. The confirmed P1 was **Compose/Swarm's separate Docker CLI client**:
it bypassed the application factory's compatibility negotiation and requested
`/v1.55/info` for API1.24, API1.39 and missing-header engines. The parent
independently reproduced the unchanged real-HTTP regression under race.

Applied corrections:

- Public CLI client injection retains resolved contexts, TLS/mTLS, Unix/agent
  transports, headers, registries and explicit operator versions. Shared
  `pkg/dockercompat` uses public fixed-version constructors; the full-SDK
  adapter keeps real Ping metadata without forced renegotiation or live-client
  version mutation. Actual old/new CLI and factory HTTP probes pass, including
  slow/recovered/unavailable engines and missing-header1.24 fallback.
- Read-only Compose status initialization, `Ps` and log collection retain the
  original caller's cancellation. Parent failing-first log-tail proof exposed
  the remaining detached initialization path. Stack teardown stays detached.
- Parent separately reproduced the eager client's offline configuration
  regression. Shared project loading preserves engine-free `Validate`/`Config`,
  interpolation, YAML output, parallel-limit validation and their prior loading
  context. The permanent test performs **zero engine requests** even with an
  unavailable engine or already-cancelled caller.
- Sheet edges and its environment-drawer footer retain the original width-only
  border behavior, rather than Tailwind4's incidental solid borders. All five
  compiled width-only utilities are checked. The actual drawer edge/footer are
  `none / 0px` in light/dark/high-contrast at1280px and390px. The duplicate
  volume-proxy SDK import and temporary review markers are removed.

Fresh product/test source is **`371cd1d6b22c70c989c85e26348303e5648b64f6`**,
not the earlier61c or intermediate457 checkpoints. Clean canonical builds
(`vcs.modified=false`, Go1.26.10) produced:

| Target | SHA-256 |
| --- | --- |
| Linux ARM64 | `d9f0f007c27709c8807caa0e0669f3a94a704ce5202b25f6da72ffeef071c60f` |
| Linux AMD64 | `7fc4d2a7d0d2daf31dc6acbb4fdb25145e2777ecc9c477ed9561a0f64d712829` |
| Windows AMD64 cross-compile only | `d84a00f415e98185cce040560e2041e0214bc8dc098f0f9b1462eae0f0a254d4` |

All **211 Go packages** pass; race tests across **all42 changed Go package
directories** pass. Module verification/tidy are clean. All18 backend/frontend
schema/client files are byte-identical after complete and repeated generation.
Fresh govulncheck still reports **14 records / six advisory IDs**, not a clean
scan or resolution of the five remaining original selected-module ranges.

The unchanged post-drawer frontend source passes all three architecture guards,
typecheck including post-build, **357 files /2,434 frontend tests**,42 Node tests,
uncached lint (**zero errors /192 existing warnings**), production and Storybook
builds, all61 original npm advisory-range checks and a fresh **zero-vulnerability
npm audit**. Stable production frontend build: **`D160u896K8Gc78umImdtU`**.

The exact371 ARM64 binary plus that frontend pass Docker/Compose, nested Swarm
(including force update), Podman/Compose, kind Kubernetes, official Edge and
real Dex/production-frontend OAuth. The same AMD64 binary passes real
Docker/container/log/Compose CRUD under emulation, not native AMD64 hardware.
Roles still expose130 permissions and custom ID6. The
[real Authentik repeat](../security/authentik-local-verification.md) passes all
four browser/code/UserInfo/team phases on the **same371 binary** in59.2s.
All live runs report zero cleanup failures; Authentik scratch/resources are
removed, no OOM occurs and host Swarm remains inactive.

Evidence: `/tmp/vessel-rest-r5-final-*` build/Go/contract/platform/UI reports;
full frontend logs retain the `/tmp/vessel-rest-r5-*` prefix. Authentik's private
safe report path/hash are recorded in its scoped document. The full requested
platform matrix and managed aggregate job return **raw exit2 solely for ACI**;
all six runnable suites and subsequent AMD64/UI/Authentik checks pass.

Sixth mandatory whole-work review is the next step, within the authorized
ten-round maximum. The previous hosted `cde139e4f` build/test success is
historical, not certification of371; fresh final-head hosted CI must finish.
Sonar's two known credentialed reviews, five Go ranges, ACI account/resource
access and native Windows/AMD64 runtime limits remain explicit. No release,
image, merge or dependency-fork publication occurred.

## Sixth review applied: final local verification

Both required models completed the sixth independent whole-work review of all
715 paths at `2326f8234`, with real isolated runtime/browser checks. Neither
found another core compatibility regression. The remaining clear small findings
were corrected, not deferred: stale Sonar workflow-token documentation; mobile
Images toolbar controls overlapping the title; and pre-existing zerolog message
loss without a pipe separator. Storybook-only locale sorting and the helper's
indirect-versus-direct test organization were not functional defects. This
small-only round ends the review sequence within the ten-round maximum.

Applied frontend/documentation source: **`1ffe1bdaf5ed3ba23817c877087d289103109b02`**.
Shared title/control rows and the Images action group wrap intrinsically without
clipping, forced clicks or hidden actions; search remains on one line and can
shrink. Non-pipe log prefixes/messages survive while key-only, last-equals and
single-timestamp behavior is retained. Four new failing-first cases plus the
94-test focused log suite pass.

Fresh final branch checks pass: **357 files /2,438 frontend tests** (five skipped,
11 todo),42 Node tests, all architecture/routes/CSS guards, typecheck including
post-build, uncached lint (zero errors /192 existing warnings), production and
Storybook builds, original61-range npm inventory and a zero-vulnerability audit.
Final production frontend: **`BYV-rVbc7SZEyf4exaSeC`**.

The actual corrected branch build passes real no-pipe/message-only/container-log
rendering with one timestamp; title/control nonoverlap, containment of every
action and natural enabled targets at **320/390/720/1280px**; natural Search/clear
at390/1280; pointer/keyboard image filtering;130 permissions/custom role ID6;
header menus and all six drawer width/theme cases. No page errors or cleanup
failures occur. Real Dex authorization-code/production callback, invalid state,
ACL, cookie reload and1100/390px controls also pass again on this final frontend.

Backend Go sources and `go.mod`/`go.sum` are byte-identical to371 (verified by
Git), so the exact371 backend binaries and211-package/42-race, all-six-platform,
AMD64 and real Authentik evidence remain correctly scoped backend evidence.
Earlier D160 frontend checks are historical, not relabeled as the new build.

Safe final evidence: `/tmp/vessel-r6-final-*` logs;
`/tmp/vessel-r6-final-ui.pzqb5z/runtime-result.json` and UI-only screenshots;
`/tmp/vessel-r6-final-oauth.json`. Failed preliminary toolbar attempts remain
failed records; final geometry and real logs pass without weakening assertions.
Owned-source whitespace checks pass. The raw whole-PR whitespace check still
reports only preserved upstream Bootstrap LICENSE CRLF and SVG closing-line
whitespace; byte-pinned provenance assets were not normalized or gate-suppressed.

The original226 closing references, release/API/tool versions, dependency counts
and external gates are unchanged. Fresh final-head hosted checks must complete
after this local checkpoint; their result belongs to the PR's check record, not
the historical `cde139e4f` success. Five selected Go ranges, authorized Sonar
reviews, ACI access and unavailable native runtime coverage are **not done yet**.
No merge, release/image publication or external dependency-fork publication occurs.

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


## 2026-10-16: extension SDK and simple examples moved to independent workspace

Authoring sources moved to `/Users/themodcraft/GolandProjects/vesselhq-extension-sdk`: the standalone Go module and protobuf schema/stubs, UI contract types, independent SDK tests/generation/packaging/CI, environment-summary and persistent-notes CLIs, operator development certificate helper, and the three simple native UI/service plugin templates. The target preserves existing `.idea` state, has a local Git repository on `main`, and preserves the externally created initial commit `901cafd` and configured `origin` at `https://github.com/TheModCraft-TMC/Vessel-HQ-Extension-SDK`. SDK import identity stays `github.com/TheModCraft-TMC/Vessel-HQ/sdk/go`; no new module publication or remote was inferred from the local directory name.

Vessel now consumes the checksum-verified published `v0.1.0-beta.1` module without a local replacement. No SDK source mirror or symlink remains. Host gRPC/HTTP authorization, integration tests, trusted package builder and the Stack Network Overview React Flow extension remain here. The already assembled persistent-notes console payload remains installed so the working development UI survives the authoring move. Package regression tests use fixed test-only wire vectors, rather than reaching into the relocated example project. The current application workflow no longer rebuilds or republishes moved SDK/simple-plugin sources; immutable beta.1 tags and their original workflow history are unchanged. See [SDK workspace ownership and commands](../extension-sdk-workspace.md).

Fresh verification after extraction:

- Independent SDK: Go 1.26.6 race tests and vet passed, including the moved operator client; pinned protobuf generation `--check` passed. All three Go examples cross-compiled for Linux amd64 and arm64. Source archive and simple native UI/service packages built from the new workspace. The extracted persistent-notes package retained the exact approved source and archive digests. Its three UI tests passed using a temporary focused host harness; the temporary source copy was removed afterward.
- Host: `GOWORK=off go -C backend-src test -mod=readonly -race ./api/nativeextensions/... ./api/http/handler/nativeextensions` passed all four packages against the published SDK. No local SDK checkout was used. Native-extension Node tooling passed 67 tests. Only the published SDK and two already selected transitive dependency checksums were added; dependency versions did not change.
- Frontend: modernization, boundary guard (3,299 source files), App Router compliance (168 pages) and typecheck passed. Browser checks on port 8999 confirmed the inline extension drawer, three-node network graph and dark six-node/four-edge traffic graph with no horizontal overflow. Full frontend tests, lint and production build were not rerun solely for the source relocation; earlier prerelease results remain separate.
- Both changed Vessel workflows and the standalone SDK workflow passed actionlint with shellcheck disabled. Changed guide local links and `git diff --check` passed. No GitHub repository or replacement SDK module was created by this extraction task; the externally configured target origin was preserved. A separate local documentation commit records target release-identity clarification and verification; no main-repository commit or remote push was made during the initial extraction. The user subsequently authorized pushing the existing SDK commits to its configured origin to trigger the independent workflow; the follow-up result is recorded separately below.

### SDK remote push and JavaScript packaging follow-up

At the user's request, SDK commits were pushed normally to the configured `TheModCraft-TMC/Vessel-HQ-Extension-SDK` origin. Final SDK commit `e60737f8524d1e614e4d1d4e360266f7e8baddfb` replaces the sole owned Python packager with dependency-light Node.js builtins and system tar. SDK documentation, AGENTS instructions and CI now use `node scripts/package-source.mjs`; CI pins Node.js 24.21.0. The public source allowlist, rejection of symlinks, readonly independent Go build, archive root/layout, atomic no-overwrite installation and SHA-256 output are preserved. Three focused packaging tests passed, including a fresh extracted-module build. No owned `.py` source remains, and the previous provisional Python-containing archive was moved outside the SDK workspace.

The [final independent SDK workflow](https://github.com/TheModCraft-TMC/Vessel-HQ-Extension-SDK/actions/runs/38934645677) completed successfully for Go 1.25.x and 1.26.x. It passed race tests/vet, all three CLI builds for Linux amd64/arm64, generated-contract verification, Node packaging tests and source artifact upload. No module identity or immutable beta.1 tag changed. The locally built Node source archive is `vesselhq-extension-sdk/dist/vessel-extension-sdk-v0.1.0-beta.1-node.tar.gz`, SHA-256 `666b7ea951c3fda02e843b8b7366ec3b5d4903dec36911e8778b3507386189e2`. The main workspace guide now selects an ignored `go.work.local` explicitly for joint development, preserving the tracked root `go.work`; CI verification remains `GOWORK=off`.

## 2026-10-16: beta publication and verified Docker Hub mirror

The immutable application tag `v1.3.1-beta.1` and historical SDK submodule tag
`sdk/go/v0.1.0-beta.1` identify source commit
`27ddd4d89fb3bac3b9c7f73f916dab757cd02abc`. The [canonical tagged workflow](https://github.com/TheModCraft-TMC/Vessel-HQ/actions/runs/38931660052)
passed every frontend, backend and SDK gate, fresh application/SDK distribution
builds, and actual backend status plus Next.js HTML startup checks on Linux amd64
and arm64. It published [application assets](https://github.com/TheModCraft-TMC/Vessel-HQ/releases/tag/v1.3.1-beta.1)
and the [historical SDK prerelease](https://github.com/TheModCraft-TMC/Vessel-HQ/releases/tag/sdk/go/v0.1.0-beta.1).
All nine downloaded binary/archive/extension assets matched the published
`SHA256SUMS`. An independent consumer fetched the SDK through the public Go proxy
and checksum database without a local replacement and built successfully.

The user selected `themodcrafttmc/vessel-hq` on Docker Hub. Feature commit
`a40a9abfe6f78b300cce4ddcce55eb01afbf72e0` adds the SDK source cutover and registry
configuration. Its [mirror-only workflow](https://github.com/TheModCraft-TMC/Vessel-HQ/actions/runs/38935854273)
passed, with the application build job skipped. Skopeo copied the already validated
OCI index, both platform manifests, attestations and all blobs while preserving
index digest `sha256:445416b2b37c21d0f6df4278b8a1e3004092fd988df2a481764dd0923fa9012d`.
Both public Docker Hub tags `themodcrafttmc/vessel-hq:1.3.1-beta.1` and `:beta`
resolve to that digest and contain `linux/amd64` and `linux/arm64`. Anonymous Hub
HTTP metadata confirmed active public tags; a fresh Hub ARM64 pull and execution
returned `1.3.1-beta.1`. The GHCR package currently requires authentication.
No `latest` alias, historical image, original release asset/checksum, or immutable
source tag was changed. The application release has an additive Docker Hub note
and `IMAGE-DockerHub.txt` verification receipt.

Future workflows build once, mirror all OCI content to Docker Hub and GHCR with
preserved digests, reject conflicting immutable tags, and move the matching
channel only after immutable copies verify. Focused publishing tests cover
immutable conflicts, denied lookups, failed copies and promotion order; they,
workflow actionlint, shell syntax and whitespace checks passed. These publication
results concern the frozen beta source; checks on later source-extraction and
update-link edits are recorded separately.

## 2026-10-16: final SDK separation and registry verification

Feature commit `a40a9abfe` separates SDK authoring/distribution from Vessel,
configures Docker Hub publication, and aligns version discovery and update links
with `themodcrafttmc/vessel-hq`. Commit `69b2edd76` adds a read-only frontend
validation dispatch to the existing image workflow. Its publishing jobs are
skipped when `verify_only` is selected; SDK builds remain in the independent SDK
repository.

[Fresh GitHub verification](https://github.com/TheModCraft-TMC/Vessel-HQ/actions/runs/38938071247)
passed on exact commit `69b2edd7639475d85bb338a2ab577468fc7f3b3c`:
modernization, boundaries (3,299 source files), App Router compliance (168 pages),
typecheck, 19 extension tests across five files, 2,357 frontend tests across 351
files (5 skipped, 11 todo), lint (0 errors, 196 warnings), and the production
webpack build with standalone packaging. Both image-publication jobs were
confirmed skipped. The isolated local build from committed `a40a9abfe` also
passed and produced a standalone server and static assets. Published-SDK host
race tests and the affected backend system/version tests passed.

A local full-suite attempt encountered an async-query timeout in the unchanged
AppTemplateFieldset test after 191 files and 1,424 tests passed. That test passed
alone without source changes; the fresh GitHub run subsequently passed the whole
suite. A duplicate Linux attempt was terminated during local Docker resource
contention, and its disposable container was removed after Docker recovered.
The normal port-8999 console still opened the dark six-node/four-edge traffic
drawer and completed a fresh Docker traffic refresh without errors.

## 2026-10-16: Node4 production-host beta smoke

Smoked the immutable Docker Hub `1.3.1-beta.1` index
`sha256:445416b2b37c21d0f6df4278b8a1e3004092fd988df2a481764dd0923fa9012d`
on Node4 as an isolated sidecar using a private production-data copy. A stable
bbolt metadata window and offline integrity check verified the copy. Its selected
Docker environment was adapted to a read-only local socket proxy, with other
environment connections disabled and external networking isolated. Workflow
definitions were retained for stack inspection. Browser access used an SSH tunnel.
This exercised production data and real Docker reads, rather than upgrading the
live datastore or testing the original agent transport.

Passed application/stack/container/network/image reads, extension package upload
and scoped approval, real stack topology, label-derived Traefik configuration,
live byte counters and measured edge animation. Browser checks covered the inline
drawer position, mobile fitting without horizontal overflow, light/dark themes,
manual zoom across live samples, and header Escape/focus restoration. The notes
UI and released Go SDK exchanged writes through the private mTLS Unix gateway;
the note survived a sidecar restart. Out-of-scope reads, stale revision/digest
requests, stale note writes, revoked service-write permission and disabled
extension access were denied. Browser console errors: zero.

Cleanup removed the sidecar, internal network, proxy, temporary login fixtures and
private production-data copy. The original running-container baseline was
restored. The live Portainer container retained its original ID, image, start
time, ports, mounts and restart policy; its HTTPS status returned 200 and its
version remains `1.3.0`. The sanitized local receipt is
`dist/native-extension-production-smoke/results.json`. This Docker smoke does not
establish production activation support or Kubernetes/Swarm/ACI coverage.
