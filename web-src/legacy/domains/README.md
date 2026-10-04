# Product domains

Each product domain is migrated here as a vertical slice with a public `index.ts` and private `views`, `components`, `services`, `models`, `mappers`, `hooks`, `queries`, and `tests` sections as needed.

Domain code may use `core`, `ui`, `shared`, and provider public APIs. Cross-domain use must go through the target domain's public `index.ts`; private subpaths are not stable APIs. Presentation components receive behavior and remote state through props, services remain independent of React state, provider DTOs are normalized by mappers, and React Query owns server state.

An incrementally migrated domain may temporarily carry a `legacy-imports.json`. It freezes the exact transitional modules and total import count at migration time; both must move downward whenever coupling is removed.
