# Azure vertical-slice migration

Status: structural ownership completed September 21, 2026; dependency cleanup remains incremental.

Azure Container Instances is now a single product slice under `app/features/azure`. GoLand's Move and Rename refactorings relocated the implementation and route ownership, updated project references, and renamed the legacy route component file to `routes.ts`.

## Ownership

- `index.ts` exposes the feature's route registration to core.
- `routes.ts` owns lazy route components and current-user guards.
- `container-instances` owns create, list, and detail workflows.
- `queries` owns React Query integration.
- `services` owns Azure transport operations and URL construction without depending on query modules.
- `DashboardView` owns the Azure dashboard workflow.

The old `app/react/azure` implementation and `app/azure` route registration contain no source files after the move. URLs, authorization wrappers, and lazy-loading behavior are unchanged.

## Transitional dependency budget

`legacy-imports.json` freezes 91 existing imports across 47 exact legacy modules. The architecture checker rejects new modules, an unreviewed count change, and stale allowlist entries. The cleanup sequence is:

1. publish environment identity/types through the Environments feature API;
2. publish access-control contracts through an Access feature boundary;
3. promote shared form, table, dashboard, and page primitives into the design system;
4. move notification, Axios, and test helpers to explicit core or test-support contracts; and
5. lower the Azure budget with each replacement until the allowlist can be removed.
