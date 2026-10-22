# Migration change summary and release commit message

Status: release candidate validation, October 12, 2026. The maintainer confirmed both migration agents have finished. This records the integrated changes and fresh release checks; publication results are reported separately.

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
