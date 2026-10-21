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
