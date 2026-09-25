# Frontend refactor progress — September 23, 2026

Status: application, domain, routing, and UI integration gates are green. The
final provider/Kubernetes/Docker placement and Git handoff are deferred to the
next session.

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

## Verification

| Check               | Result                                                        | Evidence                                                     |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| TypeScript          | Passed                                                        | `pnpm run typecheck`                                         |
| Full frontend tests | Passed: 328 files, 1 skipped; 2,306 tests, 5 skipped, 12 todo | `pnpm exec vitest run --reporter=dot`                        |
| Production bundle   | Passed with five CSS-order warnings                           | `pnpm run build`                                             |
| Frontend boundaries | Passed: 2,671 source files, zero violations                   | `pnpm run check:frontend-boundaries`                         |
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
| clusters          |   132 | configuration |   200 |
| containers        |   199 | edge          |   175 |
| environments      |   109 | gitops        |   123 |
| images            |    81 | ingress       |    12 |
| kubernetes-access |    67 | namespaces    |    67 |
| networks          |    52 | notifications |     2 |
| registries        |    52 | services      |   133 |
| settings          |    83 | stacks        |   170 |
| swarm             |    17 | teams         |    36 |
| templates         |    96 | users         |    56 |
| volumes           |    51 |               |       |

Do not delete or regenerate a ratchet wholesale. Remove entries only when the
corresponding compatibility import is removed, and delete a domain ratchet
only when its exact set reaches zero.

## Deferred final pass

Perform the remaining work in this order:

1. Finalize provider placement and public contracts under `app/providers` and
   `app/core/composition`.
2. Finalize Kubernetes transport/DTO placement and remaining Kubernetes-owned
   adapters without moving domain UI into providers.
3. Finalize Docker and Podman transport/capability placement and remove only
   the compatibility paths made obsolete by those moves.
4. Re-run typecheck, the full Vitest suite, the boundary checker, canonical
   ESLint, the production build, and `git diff --check`.
5. Smoke test login, Home, environment selection, Docker resources,
   Kubernetes resources, settings, users, and registries against a running
   backend.
6. Review staged rename detection and split commits by structural area. Do not
   stage generated build assets or unrelated local files.
7. Rebase or fetch as required, run the gates once more on the final commit
   set, then push `refactor/frontend-domain-boundaries`.

No commit or push was performed in this session. The working tree remains
intentionally unstaged so the provider/Kubernetes/Docker moves can be reviewed
and segmented with the rest of the structural rename set.
