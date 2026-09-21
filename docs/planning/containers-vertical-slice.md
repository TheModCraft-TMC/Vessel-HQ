# Containers vertical-slice migration

Status: structural ownership completed September 21, 2026; dependency cleanup and responsive redesign remain incremental.

Containers is the first domain moved into the post-migration architecture. Its 219 JavaScript and TypeScript source files now live under `app/domains/containers`; the initial checkpoint path, `app/features/containers`, is superseded. The domain owns its route registration, lazy route views, and provider-neutral container workflows.

## Ownership

- `app/domains/containers/index.ts` is the public API used by core.
- `routes.ts` owns the existing `docker.containers` state hierarchy and lazy view loading.
- `queries` owns container query keys, reads, mutations, and invalidation.
- The create, list, detail, console, logs, inspect, and stats workflows remain colocated in the domain while their internal view/component split is refined.
- Legacy Docker, environment, access-control, and shared-component callers have been rewired to the domain path; the old `app/react/docker/containers` implementation is gone.

URLs, authorization wrappers, query behavior, and lazy-loading behavior are unchanged by the move.

## Transitional dependency budget

The first move intentionally did not duplicate shared Docker transport, environment, access-control, or UI primitives. `legacy-imports.json` initially recorded 133 transitional modules and 565 import declarations. Moving query, realtime, and routing infrastructure into `app/core` lowered the active checkpoint to 128 modules and 546 imports.

The architecture check rejects:

- a new legacy module;
- any import count that differs from the recorded budget without updating the budget in the same change; and
- stale allowlist entries after their final use is removed.

This makes the remaining coupling visible and forces it downward without blocking a behavior-preserving vertical-slice move.

## Cleanup order

1. Promote stable shared UI primitives into `app/ui`, starting with buttons, form controls, status, dialogs, and table shells used by Containers.
2. Move Docker transport, DTOs, URL/header helpers, capability detection, and native errors behind `app/providers/infrastructure/docker`.
3. Move environment, registry, access-control, and webhook contracts behind public domain or provider APIs.
4. Separate route views from presentation components where behavior tests already protect the boundary.
5. Replace narrow-screen tables with the responsive list/card pattern established by the shell tokens.
6. Lower `maxImports` and remove unused module entries with every cleanup change.

The semantic token bridge and phone navigation backdrop are now present. Final colors, typography scale, and component-package adoption remain separate design decisions.
