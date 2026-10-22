# Vessel HQ repository guidance

## Project and scope

Vessel HQ is TheModCraft's maintained Portainer Community Edition fork. Preserve its Docker, Swarm, Podman, Kubernetes, and Azure ACI workflows and fork-specific GitOps, Vault, access-control, registry, audit, and realtime behavior.

- `RELEASE_VERSION` owns the Vessel release identity. The upstream API/datastore compatibility baseline is separate; do not change it for branding.
- Read `README.md` for current setup, commands, and documentation entry points.
- Read more specific `AGENTS.md` files before changing their source trees. Preserve framework-managed instruction blocks.
- Preserve unrelated edits and work from other agents. Use focused patches; do not reset, clean, or stage the whole tree as part of a scoped task.
- Do not infer migration completion or successful checks from historical progress documents. Record fresh results with the scope tested.

## Source ownership

```text
backend-src/          Go API, authorization, persistence, runtime integrations
web-src/app/          Next.js App Router routes and layouts
web-src/core/         composition, console, session, routing, query, realtime
web-src/domains/      product workflows and public APIs
web-src/providers/    infrastructure and remote-system adapters
web-src/shared/       dependency-light contracts and utilities
web-src/ui/           reusable presentation components, layouts, and tokens
```

Use [frontend architecture](docs/planning/frontend-architecture.md) and [domain/provider architecture](docs/planning/frontend-domain-provider-architecture.md) as the ownership references. Do not recreate `web-src/legacy`, Angular adapters, or compatibility allowlists merely to bypass a boundary check.

Domains consume other domains and providers through public APIs. Providers must not depend on domain views or workflows. Keep provider-native DTOs behind mappers. Shared UI must not acquire domain behavior. TanStack Query owns server cache state; use authorized realtime invalidation and bounded streams rather than adding routine polling.

## Development and generated files

- Frontend: pnpm 10.26.2 and Node.js 24.21.0 or newer in the 24.x line, as declared in `package.json`.
- Backend: Go version declared in `backend-src/go.mod` (currently 1.26.10).
- Local development: `make deps`, then `./launch-dev.sh`; see [development setup](docs/development-setup.md).
- `pnpm dev:frontend` starts the frontend separately. It uses Turbopack; `pnpm build` currently uses webpack and packages Next.js standalone output. Do not describe this as a Turborepo migration.
- Regenerate API contracts with `make generate-api` after changing Go Swagger annotations. Configuration is in `openapi-ts.config.ts`; generated output is `web-src/core/generated-api/portainer/`. Do not hand-edit generated code.
- Never commit local credentials, `.env` contents, session tokens, build output, or unrelated machine files.

## Verification

For frontend implementation changes, run the applicable architecture guards and required checks:

```sh
pnpm check:frontend-modernization
pnpm check:frontend-boundaries
pnpm check:app-router-compliance
pnpm typecheck
pnpm test
pnpm lint:ci
pnpm build
```

Use focused tests during iteration and Go tests for affected backend packages. Run browser checks when behavior or layout changes; state unavailable runtime/environment coverage explicitly. Documentation-only changes need link/path and whitespace checks, not a full application rebuild. See [verification guidance](docs/themodcraft/verification.md).

## Documentation and handoff

- Update [migration changes and draft commit message](docs/planning/migration-change-summary.md) when adding material migration changes or final verification results. Keep historical changes separate from the final commit's actual scope.
- Record future work in the [roadmap](docs/planning/vessel-hq-roadmap.md). The [plugin proposal](docs/planning/plugin-system.md) is not implemented or scheduled; keep it described as future work until implementation is authorized.
- Keep README branding, local asset paths, generated API paths, and commands aligned with the repository. Use existing light/dark Vessel logos.
- README screenshots should show the real UI and exclude credentials, private infrastructure details, and unrelated desktop content. Store publication assets in `docs/assets/`.
- The README's GPT-5.6 Sol migration credit records the maintainer's attribution; it is not a requirement to select a particular model for future work.
