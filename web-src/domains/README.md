# Product domains

Each product domain is migrated here as a vertical slice with a public `index.ts` and private `views`, `components`, `services`, `models`, `mappers`, `hooks`, `queries`, and `tests` sections as needed.

Domain code may use `core`, `ui`, `shared`, and provider public APIs. Cross-domain use must go through the target domain's public `index.ts`; private subpaths are not stable APIs. Presentation components receive behavior and remote state through props, services remain independent of React state, provider DTOs are normalized by mappers, and React Query owns server state.

Domains cannot depend on source outside `core`, `domains`, `providers`, `shared`, and `ui`. The boundary checker enforces that rule directly; the completed migration no longer uses compatibility allowlists.
