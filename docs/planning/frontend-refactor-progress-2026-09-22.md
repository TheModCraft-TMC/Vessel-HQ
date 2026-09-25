# Frontend refactor progress — September 22, 2026

Status: historical baseline. The September 23 execution closed the recorded
boundary findings; see
[the September 23 progress report](frontend-refactor-progress-2026-09-23.md)
for the current state.

## What changed today

- Consolidated the moved frontend into the canonical `app/core`, `app/domains`, `app/providers`, and `app/ui` roots.
- Expanded domain ownership across applications, clusters, configuration, containers, edge, environments, GitOps, images, ingress, Kubernetes access, namespaces, networks, notifications, registries, services, settings, stacks, Swarm, teams, templates, users, and volumes.
- Expanded provider ownership across Docker, Podman, Kubernetes, Azure ACI, edge agent, and remote registry adapters.
- Repaired public exports and import paths exposed by the folder moves, including routing guards, dialogs, menus, registries, settings, and teams.
- Removed an eager routing export cycle that made route guards undefined during test imports.
- Removed Edge compatibility symlinks that caused TypeScript to skip canonical query and view files, then repaired the revealed model and query imports.
- Made browser storage setup deterministic and ensured it runs before modules that read session state.
- Converted test support imports to dependency-light model paths so setup does not initialize application routes before per-test mocks.
- Formatted the canonical frontend roots and planning documentation.
- Added exact legacy-import snapshots for 23 domains. These files freeze today's legacy dependencies by module path so future changes must reduce or preserve the set.

## Verification snapshot

| Check                        | Result                                        | Evidence                                                                                                                                                                     |
| ---------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript                   | Passed                                        | `pnpm typecheck`                                                                                                                                                             |
| Production bundle            | Passed with three existing CSS-order warnings | `pnpm run build`                                                                                                                                                             |
| Session lifecycle regression | Passed, 5 tests                               | `pnpm exec vitest run app/core/session/session.test.ts`                                                                                                                      |
| Full frontend tests          | Confirmation run remains for tomorrow         | The last full run found three provider-wrapper failures; all affected files now pass focused verification: 13 tests across three files                                       |
| ESLint on canonical roots    | Passed with 147 existing warnings             | 0 errors across `app/core`, `app/domains`, `app/providers`, and `app/ui`                                                                                                     |
| Frontend boundaries          | 570 violations remain                         | 380 private cross-domain imports, 164 invalid UI dependencies, 21 component behavior dependencies, 3 framework-bound services, 1 model dependency, and 1 provider dependency |

## Current structural state

The large folder move is now represented in the working tree. Git will show many deleted legacy paths and untracked canonical paths until the move is staged, at which point rename detection can pair equivalent files. The current work should be reviewed and committed in structural groups rather than as one opaque repository-wide commit.

The legacy import snapshots are now stable. The remaining 570 boundary findings describe real architecture work and are intentionally visible. They were not hidden behind broader exceptions during cleanup. Tomorrow starts with one clean full-suite confirmation before parallel refactor work begins.

## Handoff rule

Use [the September 23 execution plan](frontend-refactor-plan-2026-09-23.md) as the assignment board. Each agent owns one task, changes only the named folders and public API files, and reports the boundary count it removed. Shared route registries, domain barrel files, and ratchets have a single owner per group.
