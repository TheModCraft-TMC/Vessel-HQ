# Frontend module architecture

Status: accepted migration contract as of September 21, 2026; destination terminology is defined by [Frontend domain and provider architecture](frontend-domain-provider-architecture.md).

This document defines the incremental destination for the React frontend. It does not require a big-bang move of the existing `app/react` tree. New slices use the destination structure, and existing domains move one complete workflow at a time.

## Module map

| Path                                      | Responsibility                                                             | May depend on                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `app/core`                                | Application boot, composition, routing, session, and realtime coordination | Public domain APIs, UI, shared contracts, and transitional legacy registrations |
| `app/ui`                                  | Vessel HQ tokens, layouts, and reusable presentation primitives            | Shared contracts and external UI libraries                                      |
| `app/domains/<domain>`                    | A product domain's routes, views, and vertical slice                       | Core contracts, UI, shared contracts, and public provider/domain APIs           |
| `app/providers/infrastructure/<provider>` | Execution-environment and orchestrator adapters                            | Shared contracts and external SDKs                                              |
| `app/providers/remotes/<provider>`        | Registry and external artifact-source adapters                             | Shared contracts and external SDKs                                              |

The current boot and routing implementation lives in `app/core`. The application shell and reusable presentation converge under `app/ui`. Existing route registrars and sidebar code remain transitional dependencies until their owning domain slices move; moving their files without their routes, queries, and tests would only disguise the old coupling.

## Domain contract

A domain can contain the sections it needs:

```text
app/domains/containers/
  index.ts
  views/
  components/
  models/
  mappers/
  services/
  hooks/
  queries/
  tests/
```

- `index.ts` is the only cross-domain API. Another domain must not import a private subpath.
- Migrated domains do not add dependencies on the transitional legacy tree. A behavior-preserving first move may snapshot unavoidable dependencies in `legacy-imports.json`; its exact module allowlist and import budget must move downward in later changes.
- Views own route-level composition, permissions, loading, and error states. `pages` is superseded terminology because the same surface may run in a browser, desktop shell, or embedded application.
- Components are presentation-focused. Remote state and behavior arrive through explicit props.
- Services contain domain operations. Provider clients own platform-native transport, DTOs, and error normalization. Neither imports React, Zustand, React Query, or React-facing domain sections.
- Queries adapt services to React Query and own query keys, caching, mutation invalidation, and realtime invalidation.
- Models remain dependency-light and distinguish transport DTOs from normalized domain or view models when those shapes differ.
- Mappers translate provider DTOs into domain contracts so provider-native shapes do not leak into views.
- A domain-private component stays private until at least one stable cross-domain use case justifies promotion to `app/ui`.

## Automated enforcement

`pnpm check:frontend-boundaries` scans JavaScript and TypeScript source under the destination roots. It rejects:

- relative imports that cross architecture layers;
- application or legacy dependencies from shared UI;
- imports into another domain or provider's private files;
- new imports from migrated domains into the transitional legacy tree, plus stale or increased migration allowlists;
- private domain imports from core or UI;
- query, service, hook, or view dependencies from presentation components;
- provider imports from domain views, components, hooks, queries, or routes;
- domain imports of provider DTOs or private implementation files;
- React state dependencies from services; and
- upward dependencies from models.

The check is part of `pnpm lint:ci`. It applies immediately to every migrated slice while the existing modernization guard continues to prohibit Angular compatibility and frontend polling regressions.

## Migration procedure

1. Choose a complete user workflow and identify its routes, authorization, services, models, queries, UI, tests, and realtime invalidations.
2. Create the domain with a deliberately small public API and identify any external-system behavior that belongs behind a provider API.
3. Move behavior without changing it, keeping compatibility adapters at the destination boundary when required.
4. Run type checking, boundary checks, focused tests, lint, and a production build.
5. Remove superseded legacy files and lower any applicable modernization ratchets.
6. Rename route-level UI to `views` when its complete domain is touched; make visual or responsive changes only after the behavior-preserving move is stable.

The complete domain map and legacy-to-destination migration sequence are defined in [Frontend domain schema](frontend-domain-schema.md).

The structural Containers move is recorded in [Containers vertical-slice migration](containers-vertical-slice.md). Semantic compatibility tokens and the responsive shell contract now exist; dependency cleanup and workflow-level responsive changes remain in progress.

The structural Azure move is recorded in [Azure vertical-slice migration](azure-vertical-slice.md). Its initial consolidated slice is a migration checkpoint; workflows converge on product domains while Azure Container Instances transport moves to `providers/infrastructure/azure-aci`.

The structural Authentication move is recorded in [Authentication vertical-slice migration](auth-vertical-slice.md). Login, logout, session operations, and authentication routes share a public domain boundary while their frozen legacy dependencies are reduced incrementally.

The shared environment model extraction is recorded in [Environments domain contract](environments-domain-contract.md). Environment identity and platform contracts have one public domain API; queries, services, routes, and views remain staged follow-up slices.

The accepted future split between TanStack Query server state, scoped lifecycle invalidations, and bounded telemetry streams is documented in [Realtime state architecture](realtime-state-architecture.md).
