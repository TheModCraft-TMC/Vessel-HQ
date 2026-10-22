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

## Extended remediation checkpoint — October 22, 2026

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
