# Frontend refactor progress — final verification snapshot

Status: application, domain, routing, UI integration, provider/Kubernetes
placement, TypeScript, frontend boundary, lint, test, production build, and
local runtime gates are green. The refactor is committed on
`refactor/frontend-domain-boundaries`; local internal and OAuth authentication
have both been verified against the running backend.

## Completed

- Reduced frontend architecture findings from the September 22 baseline of
  570 to zero without broadening the general cross-domain allowlist.
- Kept route registration one-way: core composition imports domain manifests,
  while route modules import dependency-light routing helpers directly.
- Removed import-time cycles from Azure, Edge, cluster, environment, user, and
  registry entry points.
- Made route views lazy where eager domain barrels initialized large route
  trees during tests.
- Removed registry self-barrel imports so internal registry modules consume
  their model contract directly.
- Added the layout and application-composition providers to the shared router
  test harness, matching the production provider contract.
- Repaired Podman capability selection, PVC namespace filtering tests, route
  test state, icon mocks, and provider-aware stack tests exposed by the move.
- Added a deterministic nullable canvas context to jsdom setup so xterm's
  import-time capability probe no longer floods every test worker with errors.
- Moved the remaining Kubernetes resource transport behind
  `app/providers/infrastructure/kubernetes`, including typed mutation methods,
  error normalization, and the configuration-service and ingress adapters.
- Kept Kubernetes provider DTOs and transport contracts behind the provider
  public index; migrated service and ingress callers no longer import legacy
  Axios directly.
- Kept authenticated layout bindings below `UserProvider` so public routes no
  longer require an authenticated user context.
- Made named lazy routes safe when a domain barrel already exports a lazy
  component, avoiding React 19 nested-lazy runtime failures.
- Centralized global xterm and ingress styles and limited CSS-module order
  suppression to conflicts containing only scoped styles.
- Corrected OAuth state validation, callback parsing, URL encoding, and
  authorization-code exchange, including codes containing reserved URL
  characters.
- Disabled the administrator-only settings query for standard users in the
  shared layout.
- Restored the standard-user sidebar by making public settings, rather than an
  administrator role, the only prerequisite for rendering primary navigation.
- Replaced the client hydration sentinel with an explicit post-hydration state
  transition so hard reloads and logout cannot remain stuck on the loading
  shell.
- Stabilized environment layout synchronization by selecting individual
  Zustand values/actions, avoiding redundant environment writes, and mapping
  Docker, Kubernetes, Azure, and Podman platform enums explicitly.

## Verification

| Check                     | Result                                                        | Evidence                                                                  |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| TypeScript                | Passed                                                        | `pnpm typecheck`                                                          |
| Full frontend tests       | Passed: 335 files, 1 skipped; 2,324 tests, 5 skipped, 12 todo | `pnpm test`                                                               |
| Production bundle         | Passed with zero webpack warnings                             | `pnpm build`                                                              |
| Frontend boundaries       | Passed: 2,681 source files, zero violations                   | `pnpm check:frontend-boundaries`                                          |
| Full frontend lint gate   | Passed with existing non-blocking warnings                    | `pnpm lint:ci`                                                            |
| Focused backend auth tests | Passed                                                        | `go test ./api/oauth ./api/http/handler/settings ./api/http/handler/auth` |
| OAuth browser round trip  | Passed                                                        | local mock provider to authenticated Home as a standard user              |
| Browser UI smoke          | Passed                                                        | admin and standard-user navigation; Docker dashboard, containers, images, networks, volumes, stacks, events, and host; compact and expanded sidebar; zero clean-tab console errors |
| Whitespace                | Passed                                                        | `git diff --check`                                                        |

The verification machine used Node 25.9.0 while the package declares Node
`^22.22.1`; pnpm therefore prints an engine warning. The missing optional
`.env`, Babel deprecation, and CSS-order build warnings have been resolved.

## Transitional legacy-import ratchets

The boundary checker validates these exact remaining counts and rejects any
new path, even when a total would otherwise stay unchanged:

| Domain            | Count | Domain        | Count |
| ----------------- | ----: | ------------- | ----: |
| applications      |   145 | azure         |    37 |
| clusters          |   132 | configuration |   199 |
| containers        |   199 | edge          |   175 |
| environments      |   109 | gitops        |   123 |
| images            |    79 | ingress       |    11 |
| kubernetes-access |    67 | namespaces    |    67 |
| networks          |    52 | notifications |     2 |
| registries        |    52 | services      |   129 |
| settings          |    83 | stacks        |   170 |
| swarm             |    17 | teams         |    36 |
| templates         |    96 | users         |    56 |
| volumes           |    50 |               |       |

Do not delete or regenerate a ratchet wholesale. Remove entries only when the
corresponding compatibility import is removed, and delete a domain ratchet
only when its exact set reaches zero.

## Retained compatibility paths

The remaining compatibility surface is intentional and measured:

- The 23 domain `legacy-imports.json` files retain exact allowlists for the
  transitional application tree. The current aggregate is 2,674 checked
  source files with 2,086 retained legacy imports across those ratchets.
- `app/shared/http/index.ts` remains the compatibility gateway to the
  configured legacy Axios client while provider transports are migrated.
- `app/core/routing/registry/domain-manifests.ts` retains the legacy route
  definitions that have not yet moved to domain-owned manifests.
- Provider clients expose stable public indexes; internal DTOs, mappers, and
  transport adapters are not imported directly by domains.

Each retained path has an explicit removal condition: migrate its callers to
the canonical public API, remove the allowlist entry, and rerun the boundary
checker. No compatibility path was broadened to make the final checks pass.

## Handoff

The remaining handoff work is review and release hygiene:

1. Review staged rename detection and split commits by structural area. Do not
   stage generated build assets or unrelated local files.
2. Kubernetes resource routes still require a Kubernetes environment for live
   smoke testing. The available local Docker environment and its principal
   resource routes are verified.
3. The final commit set is ready for review on
   `refactor/frontend-domain-boundaries`.

The integrated refactor checkpoint is `c669923fb`; the verification snapshot is
`637554091`. Both are intended for review together.
