# Frontend refactor plan — September 23, 2026

Goal: close the remaining integration debt from the repository-wide folder move while continuing the UI and infrastructure split.

## Execution status

Groups 1–3 are complete for the current application/domain/UI move. The
boundary checker now reports zero violations across 2,671 source files, the
full Vitest suite passes, TypeScript passes, and the production bundle builds.
The remaining `legacy-imports.json` counts are exact ratchets for compatibility
imports that still exist; they are not unreported boundary failures.

The deferred final pass is intentionally limited to provider, Kubernetes, and
Docker placement, followed by rename/staging review, live navigation smoke
testing, commit segmentation, and push. See
[the September 23 progress report](frontend-refactor-progress-2026-09-23.md).

The 12 tasks are grouped into three batches of four. Tasks inside a group can run in parallel when agents keep to the stated ownership. Finish Group 1 before merging Group 2, and finish Group 2 before the final verification group.

## Group 1 — public boundaries and route ownership

### 1. Kubernetes domain public APIs

**Own:** `app/domains/applications`, `clusters`, `configuration`, `ingress`, `kubernetes-access`, and `namespaces`.

- Replace private imports between these domains with explicit public exports or dependency-light shared contracts.
- Keep Kubernetes transport DTOs in `app/providers/infrastructure/kubernetes`.
- Remove resolved entries from each domain's `legacy-imports.json`.

**Done when:** these domains have no private cross-domain imports and their focused tests and typecheck pass.

### 2. Docker resource domain public APIs

**Own:** `app/domains/containers`, `images`, `networks`, `services`, `stacks`, `swarm`, and `volumes`.

- Define the smallest public types and operations used across resource domains.
- Move Docker-native DTO access behind `app/providers/infrastructure/docker`.
- Preserve query keys and route behavior while replacing deep imports.

**Done when:** Docker resource domains consume public APIs and the private-import boundary count falls for every owned folder.

### 3. Administration domain public APIs

**Own:** `app/domains/environments`, `registries`, `settings`, `teams`, `templates`, and `users`.

- Separate dependency-light models from route, view, and query exports.
- Stop test helpers and consumers from loading route trees through model imports.
- Remove duplicated compatibility exports after callers move.

**Done when:** model-only imports do not initialize routes and administration domains have explicit public contracts.

### 4. Route and manifest isolation

**Own:** `app/core/routing`, domain `routes.ts`, and domain `route-manifest.ts` files.

- Keep the routing public API free of eager imports back into the route registry.
- Make manifest registration one-way from core composition into domain manifests.
- Add a focused import test that catches undefined guards and circular initialization.

**Done when:** all route manifests load in tests without cycles and the production build passes.

## Group 2 — UI and infrastructure separation

### 5. UI dependency inversion

**Own:** `app/ui` and only the adapter props required in consuming domains.

- Remove UI imports from domains, providers, generated clients, and legacy application services.
- Replace environment-specific behavior with props, callbacks, or dependency-light UI contracts.
- Keep domain-specific tables and forms within their domains.

**Done when:** the 164 invalid UI dependency findings reach zero without adding exceptions.

### 6. Presentation and service purity

**Own:** boundary findings for `components`, `models`, and `services` across `app/domains`.

- Move query ownership and workflow state out of presentation components.
- Remove framework imports from the three flagged services.
- Remove the remaining model dependency on higher layers.

**Done when:** the 21 component findings, 3 service findings, and 1 model finding reach zero.

### 7. Provider contract isolation

**Own:** `app/providers` and composition adapters in `app/core/composition`.

- Fix the remaining provider dependency violation.
- Expose provider-neutral capabilities through provider public APIs.
- Keep React, routes, domain views, and query hooks out of providers.

**Done when:** provider boundary checks pass and Docker, Podman, Kubernetes, Azure ACI, edge agent, and remote adapters typecheck independently.

### 8. Legacy snapshot reduction

**Own:** all `legacy-imports.json` files; coordinate changes after Tasks 1–7 land.

- Recalculate exact imports after each merged task.
- Delete entries and policy files when their sets reach zero.
- Reject new legacy paths even when the total count is unchanged.

**Done when:** every snapshot exactly matches current imports and the total is lower than the September 22 baseline.

## Group 3 — integration and handoff

### 9. Test support and moved fixtures

**Own:** `app/setup-tests`, `app/react-tools/test-mocks.ts`, and failing tests caused by moved contracts.

- Keep setup imports dependency-light and type-only where possible.
- Repair mock factories and fixtures to use current domain models.
- Fix failures caused by path moves without weakening assertions.

**Done when:** the full Vitest suite passes with no import-time suite failures.

### 10. Lint and format closure

**Own:** lint findings in the canonical roots after Groups 1 and 2 merge.

- Resolve all ESLint errors.
- Triage existing React compiler warnings separately and avoid broad disables.
- Run Prettier on changed files and `git diff --check`.

**Done when:** ESLint exits zero, formatting checks pass, and no whitespace errors remain.

### 11. Build and navigation smoke test

**Own:** integration only; do not redesign views during this task.

- Run typecheck, boundary checks, production build, and focused route-manifest tests.
- Smoke test login, Home, environment selection, Docker resource routes, Kubernetes resource routes, settings, users, and registries.
- Record any existing CSS-order warnings separately from failures.

**Done when:** automated gates pass and the named navigation paths render without route or authorization errors.

### 12. Documentation and commit segmentation

**Own:** `docs/planning` and the integration commit sequence.

- Update the progress snapshot with final counts and verification evidence.
- Record public API decisions and any intentionally retained legacy imports.
- Stage and commit by coherent structural area so Git can identify moves and reviewers can inspect behavior changes.

**Done when:** documentation matches the repository, every commit is buildable, and the next plan is based on measured remaining work.

## Merge controls

- One owner edits `app/core/routing/registry`, a domain `index.ts`, or a domain ratchet at a time.
- Each task reports before and after boundary counts for its owned category.
- Rebase before handing off public API changes to another group.
- Do not add broad allowlists to make a gate pass; snapshots must name exact current modules.
