<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Frontend architecture and tooling

- Follow the repository-wide [agent guidance](../AGENTS.md) and the [domain/provider architecture](../docs/planning/frontend-domain-provider-architecture.md).
- `app/` owns Next.js routes/layouts; product behavior belongs in `domains/`, console/session/composition in `core/`, external adapters in `providers/`, reusable presentation in `ui/`, and dependency-light contracts/utilities in `shared/`.
- Use public domain/provider APIs across ownership boundaries. Do not restore the removed `legacy/` tree or loosen architecture guards to make imports pass.
- Development uses Turbopack; production currently builds with webpack. Read the installed Next.js guides before changing framework behavior, as required above.
- Keep generated API consumers aligned with `core/generated-api/portainer`; regenerate rather than editing generated files.

## Shared component conventions

- Put each new or restructured shared React component in its own directory.
- Colocate a same-named CSS Module with the component, for example
  `Button/Button.tsx` and `Button/Button.module.css`.
- Import the CSS Module from the component and attach `styles.root` to its root
  element so component-scoped CSS can be added without further wiring.
- Keep broadly reusable styling in shared primitives; use the colocated module
  for styles that belong only to that component.
