# Feature slices

Each product domain is migrated here as a vertical slice with a public `index.ts` and private `pages`, `components`, `services`, `models`, `hooks`, `queries`, and `tests` sections as needed.

Feature code may use `core`, `layouts`, and `design-system`. Cross-feature use must go through the target feature's public `index.ts`; private subpaths are not stable APIs. Presentation components receive behavior and remote state through props, services remain independent of React state, and React Query owns server state.

An incrementally migrated feature may temporarily carry a `legacy-imports.json`. It freezes the exact transitional modules and total import count at migration time; both must move downward whenever coupling is removed.
