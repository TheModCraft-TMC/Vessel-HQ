# Frontend refactor progress — final verification snapshot

Status: application, domain, routing, UI integration, provider/Kubernetes
placement, TypeScript, and full frontend test gates are green. The working tree
remains intentionally unstaged for review and commit segmentation.

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

## Verification

| Check               | Result                                                        | Evidence                                                     |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| TypeScript          | Passed                                                        | `pnpm run typecheck`                                         |
| Full frontend tests | Passed: 330 files, 1 skipped; 2,309 tests, 5 skipped, 12 todo | `pnpm test`                                                  |
| Production bundle   | Passed with five CSS-order warnings                           | `pnpm run build`                                             |
| Frontend boundaries | Passed: 2,674 source files, zero violations                   | `pnpm run check:frontend-boundaries`                         |
| ESLint              | Passed on canonical roots with existing warnings only         | `pnpm exec eslint app/core app/domains app/providers app/ui` |
| Whitespace          | Passed                                                        | `git diff --check`                                           |

The verification machine used Node 25.9.0 while the package declares Node
`^22.22.1`; pnpm therefore prints an engine warning. The build also reports the
missing optional `.env`, a Babel plugin deprecation, and five existing CSS
ordering warnings. None failed the build.

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
2. Smoke test login, Home, environment selection, Docker resources,
   Kubernetes resources, settings, users, and registries against a running
   backend.
3. Re-run the gates on the final commit set, then push
   `refactor/frontend-domain-boundaries`.

No commit or push was performed in this session. The working tree remains
intentionally unstaged so the provider/Kubernetes/Docker moves can be reviewed
and segmented with the rest of the structural rename set.
