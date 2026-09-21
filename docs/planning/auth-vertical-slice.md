# Authentication vertical-slice migration

Status: structural move complete as of September 21, 2026.

Authentication now lives in `app/features/auth`. The feature owns login, logout, session initialization, administrator checks, and its lazy route components. Consumers use `@/features/auth`; they no longer reach through a framework or product namespace to private authentication files.

## Boundary

- `index.ts` is the cross-feature API for session operations and login/logout routes.
- `routes.ts` owns lazy loading for the authentication screens.
- `auth.service.ts` owns the current authenticated-user session and login/logout operations.
- `LoginView.tsx` and `LogoutView.tsx` remain behavior-compatible while surrounding settings, environment, notification, and app-state dependencies are migrated later.

## Dependency ratchet

`legacy-imports.json` freezes the first checkpoint at 17 exact transitional modules and 27 import declarations. New legacy dependencies fail the frontend boundary check. The budget must move downward as app state, settings, notifications, user identity, and reusable UI move to their canonical owners.

## Compatibility guarantees

The move preserves the `portainer.auth` and `portainer.logout` state names, URLs, OAuth flow, stored return URL, session initialization, realtime shutdown, and cache-refresh behavior.
