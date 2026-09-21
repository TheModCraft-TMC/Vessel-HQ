# Azure vertical-slice migration

Status: structural ownership completed September 21, 2026; dependency cleanup remains incremental.

Azure Container Instances was first consolidated under the superseded `app/features/azure` checkpoint. The accepted destination splits that code between product domains and the external adapter at `app/providers/infrastructure/azure-aci`. GoLand's Move and Rename refactorings relocated the initial implementation and route ownership, updated project references, and renamed the legacy route component file to `routes.ts`.

## Ownership

- Domain `index.ts` files expose deliberate public APIs to core and other domains.
- `routes.ts` owns lazy route components and current-user guards.
- Domain views own create, list, and detail workflows.
- `queries` owns React Query integration.
- The target `providers/infrastructure/azure-aci` adapter will own Azure transport, native DTOs, capability handling, provider-specific errors, and URL construction without depending on domain query modules.
- `DashboardView` owns the Azure dashboard workflow.

The old `app/react/azure` implementation and `app/azure` route registration contain no source files after the move. URLs, authorization wrappers, and lazy-loading behavior are unchanged.

## Transitional dependency budget

`legacy-imports.json` freezes 91 existing imports across 47 exact legacy modules. The architecture checker rejects new modules, an unreviewed count change, and stale allowlist entries. The cleanup sequence is:

1. publish environment identity/types through the Environments domain API;
2. publish access-control contracts through an Access domain boundary;
3. promote shared form, table, dashboard, and view primitives into `app/ui`;
4. move notification, Axios, and test helpers to explicit core or test-support contracts; and
5. extract the Azure Container Instances provider and lower the transition budget with each replacement until the allowlist can be removed.
