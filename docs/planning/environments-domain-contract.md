# Environments domain contract

Status: shared domain contract extracted on September 21, 2026; workflow migration remains in progress.

## What moved

The canonical environment types now live in `app/domains/environments/types.ts` and are exported only through `app/domains/environments/index.ts`. The initial extraction used the superseded `app/features/environments` path; the former `app/react/portainer/environments/types.ts` path remains removed.

All 545 call sites now import the public `@/domains/environments` API. This includes Docker, Kubernetes, Azure, navigation, access control, registries, templates, tests, and the remaining legacy environment views. The move changes ownership and import direction only; runtime behavior, URLs, API payloads, and cache semantics are unchanged.

## Boundary effect

Environment identity, type, status, engine, platform, grouping, and configuration are cross-domain contracts rather than Portainer UI implementation details. Giving them a domain-owned public API removes the most widely used `react/portainer` dependency without introducing a `domains/portainer` umbrella.

The move also lowers existing transition budgets:

- Azure: 91 to 78 legacy imports.
- Containers: 546 to 492 legacy imports.

The environment contract has two frozen transitional dependencies:

- tag identity from `@/portainer/tags/types`;
- Docker snapshot shape from `@/react/docker/snapshots/types`.

`app/domains/environments/legacy-imports.json` prevents that list or count from growing. Those contracts should move behind stable domain, provider, or shared APIs before the transition file is removed.

## Next slices

1. Split transport DTO aliases from stable environment domain models.
2. Extract the tag identity and snapshot contracts from their legacy owners.
3. Move environment queries and services as a behavior-preserving vertical slice.
4. Move environment list, details, grouping, scheduling, and creation workflows behind domain routes and views.
5. Remove the remaining `app/react/portainer/environments` tree only after its routes and tests have migrated.

Each slice must keep the public API deliberate, lower the exact legacy-import budget, and pass architecture checks, type checking, focused tests, lint, and the production build.
