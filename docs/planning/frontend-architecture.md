# Frontend module architecture

Status: accepted and enforced for the post-migration architecture as of September 21, 2026.

This document defines the incremental destination for the React frontend. It does not require a big-bang move of the existing `app/react` tree. New slices use the destination structure, and existing domains move one complete workflow at a time.

## Module map

| Path                    | Responsibility                                                                  | May depend on                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `app/core`              | Application boot, providers, routing, authentication, and realtime coordination | Public feature APIs, layouts, design system, and explicitly transitional legacy registrations |
| `app/design-system`     | Vessel HQ tokens and shared, framework-neutral UI primitives                    | External UI libraries and other design-system modules only                                    |
| `app/layouts`           | Shell, navigation, and reusable page layouts                                    | Core contracts, public feature APIs, and design system                                        |
| `app/features/<domain>` | A product domain's routes and vertical slice                                    | Core, layouts, design system, its own private modules, and other features' public APIs        |

The current boot and routing implementation now lives in `app/core`. The application shell lives in `app/layouts`. Existing route registrars and sidebar code remain transitional dependencies until their owning feature slices move; moving their files without their routes, queries, and tests would only disguise the old coupling.

## Feature contract

A feature can contain the sections it needs:

```text
app/features/containers/
  index.ts
  pages/
  components/
  services/
  models/
  hooks/
  queries/
  tests/
```

- `index.ts` is the only cross-feature API. Another feature must not import a private subpath.
- Migrated features do not add dependencies on the transitional legacy tree. A behavior-preserving first move may snapshot unavoidable dependencies in `legacy-imports.json`; its exact module allowlist and import budget must move downward in later changes.
- Pages own route-level composition, permissions, loading, and error states.
- Components are presentation-focused. Remote state and behavior arrive through explicit props.
- Services contain API calls and domain operations. They do not import React, Zustand, React Query, or React-facing feature sections.
- Queries adapt services to React Query and own query keys, caching, mutation invalidation, and realtime invalidation.
- Models remain dependency-light and distinguish transport DTOs from normalized domain or view models when those shapes differ.
- A feature-private component stays private until at least one stable cross-feature use case justifies promotion to the design system.

## Automated enforcement

`pnpm check:frontend-boundaries` scans JavaScript and TypeScript source under the four destination roots. It rejects:

- relative imports that cross architecture layers;
- application or legacy dependencies from the design system;
- imports into another feature's private files;
- new imports from migrated features into the transitional legacy tree, plus stale or increased migration allowlists;
- private feature imports from core or layouts;
- query, service, hook, or page dependencies from presentation components;
- React state dependencies from services; and
- upward dependencies from models.

The check is part of `pnpm lint:ci`. It applies immediately to every migrated slice while the existing modernization guard continues to prohibit Angular compatibility and frontend polling regressions.

## Migration procedure

1. Choose a complete user workflow and identify its routes, authorization, services, models, queries, UI, tests, and realtime invalidations.
2. Create the feature with a deliberately small public API.
3. Move behavior without changing it, keeping compatibility adapters at the destination boundary when required.
4. Run type checking, boundary checks, focused tests, lint, and a production build.
5. Remove superseded legacy files and lower any applicable modernization ratchets.
6. Make visual or responsive changes only after the behavior-preserving move is stable.

The complete domain map and legacy-to-destination migration sequence are defined in [Frontend domain schema](frontend-domain-schema.md).

The structural Containers move is recorded in [Containers vertical-slice migration](containers-vertical-slice.md). Semantic compatibility tokens and the responsive shell contract now exist; dependency cleanup and workflow-level responsive changes remain in progress.

The structural Azure move is recorded in [Azure vertical-slice migration](azure-vertical-slice.md). Its implementation, routes, and transport helpers now share one feature boundary; its frozen legacy dependency budget must move downward during cleanup.

The structural Authentication move is recorded in [Authentication vertical-slice migration](auth-vertical-slice.md). Login, logout, session operations, and authentication routes now share a public feature boundary while their frozen legacy dependencies are reduced incrementally.

The accepted future split between TanStack Query server state, scoped lifecycle invalidations, and bounded telemetry streams is documented in [Realtime state architecture](realtime-state-architecture.md).
