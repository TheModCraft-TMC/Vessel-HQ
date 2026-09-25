# Vessel HQ product and architecture roadmap

Status: refactor foundation in progress; future product and design items in this document are not implementation commitments.

Last updated: September 22, 2026.

This document records why the fork exists, what has already changed, and the direction agreed for future work. It is deliberately explicit about status so that roadmap context is not mistaken for shipped behavior.

## Product context

Portainer announced that 2.45 is the final 2.x release, that Community Edition will remain on the maintained 2.x line, and that Portainer 3.x will become Kubernetes-first and enterprise-oriented. Native Docker, Swarm, and Podman environments remain supported, but are secondary to the new product direction and will not receive feature parity where new capabilities depend on Kubernetes.

Vessel HQ therefore has a distinct long-term purpose: remain a modern, independently maintained, Docker- and Kubernetes-capable control plane with a strong focus on homelab operators. It is not intended to follow every upstream product decision or to become an enterprise-first console.

Reference: [Portainer 3.0 announcement](https://www.portainer.io/blog/portainer-3-0-is-coming).

## Repository and release identity

### Completed

- The canonical project repository is [TheModCraft-TMC/Vessel-HQ](https://github.com/TheModCraft-TMC/Vessel-HQ).
- The older Portainer forks remain available as historical and maintenance references. They are not to be deleted as part of the repository migration.
- Vessel HQ branding is present in the application and build assets.
- The maintained release version is distinct from the upstream API and database compatibility version.
- The update checker reads numeric tags from the maintained Docker Hub repository instead of upstream Portainer releases.

### Transitional release

The React migration WIP was published from commit `0298e99dd56c08fdd4004fb995697cdf655be872` with these transitional image references:

- `themodcrafttmc/portainer:2.39.3.2.26`
- `themodcrafttmc/portainer:latest`
- OCI index digest `sha256:1f3401136ffc26dcac53660473a1f1590d7727e27776ba2d4b1123ab6cef9345`
- platforms `linux/amd64` and `linux/arm64`

### Planned, not started

- Create a new Docker Hub repository dedicated to Vessel HQ.
- Publish future Vessel HQ images to that repository.
- Update release automation, documentation, update discovery, and UI links only after its final name is known.
- Keep the existing `themodcrafttmc/portainer` repository and its published tags intact. Do not repurpose or delete them.

## Completed frontend foundation

The migration established the baseline for future product work:

- React 19.3 owns application startup, routing, layouts, and routes.
- AngularJS, Angular route registrations, legacy controllers, runtime templates, and React-to-Angular adapters were removed.
- Routes are lazy-loaded and the production entrypoint was reduced to approximately 5.14 MiB at the migration checkpoint.
- The application has a server-rendered shell and hydrates through React.
- Live server state uses an initial HTTP fetch followed by authenticated WebSocket-driven React Query invalidation instead of frontend data polling.
- Business Edition advertising and upgrade prompts were removed.
- Release discovery uses the maintained image repository and fork image version.
- Environment navigation was repaired after route migration.
- Roles/User and Tags/Environment content containers were aligned with the shared view grid.
- The migration checkpoint passed the frontend test suite, type checking, linting, modernization guard, production build, and targeted backend tests.

The upstream API and datastore compatibility version remains `2.45.0`. That value is not the Vessel HQ image release number and must not be changed merely for branding.

## Target React architecture

The enforced module contract and incremental migration procedure are documented in [Frontend module architecture](frontend-architecture.md). The canonical destination is defined in [Frontend domain and provider architecture](frontend-domain-provider-architecture.md): application boot and routing live in `app/core`, product behavior lives in `app/domains`, external-system adapters live in `app/providers`, and shared presentation converges in `app/ui`. `pnpm check:frontend-boundaries` protects those boundaries from invalid dependencies.

Containers is the first migrated vertical slice. Its implementation, lazy routes, public API, and shrinking transitional dependency budget are described in [Containers vertical-slice migration](containers-vertical-slice.md).

The September 22 structural pass expanded the canonical layout across the main Docker, Kubernetes, Edge, administration, GitOps, configuration, and registry folders, together with Docker, Podman, Kubernetes, Azure ACI, edge-agent, and remote providers. Typecheck and the production build pass at the integration checkpoint. Exact legacy-import snapshots now prevent dependency drift while the remaining cross-domain, UI, service, model, and provider boundary findings are removed. Current evidence and the next assignment plan are in [Frontend refactor progress — September 22, 2026](frontend-refactor-progress-2026-09-22.md) and [Frontend refactor plan — September 23, 2026](frontend-refactor-plan-2026-09-23.md).

The future server-state and streaming model is documented in [Realtime state architecture](realtime-state-architecture.md): TanStack Query remains the authoritative server cache, authorized lifecycle events evolve toward scoped and batched invalidation, and high-frequency logs, terminals, and metrics remain isolated bounded streams. Redux and RTK Query are not planned.

The next refactor organizes each product domain into views, components, models, mappers, services, hooks, and queries. `views` replaces the superseded `pages` term because route-level application surfaces are not limited to a browser page. Services remain explicit TypeScript modules rather than hidden global state containers.

Prefer domain-owned vertical slices:

```text
app/
  core/                    application boot, composition, routing, session, realtime
  domains/
    containers/
      views/
      components/
      models/
      mappers/
      services/
      hooks/
      queries/
      tests/
    environments/
    stacks/
    images/
    users/
    settings/
  providers/
    infrastructure/
      docker/
      podman/
      kubernetes/
      azure-aci/
    remotes/
      docker-hub/
      ghcr/
      aws-ecr/
      azure-acr/
  ui/                      reusable components, layouts, and tokens
  shared/                  dependency-light contracts and utilities
```

### Dependency rules

- Views coordinate routes, permissions, and application-surface composition.
- Components are presentation-focused and receive explicit props.
- Services contain domain operations but do not own React state.
- Providers contain external protocol clients, native DTOs, capability detection, error normalization, and adapter mappers.
- React Query owns remote state, initial fetching, cache lifetime, and invalidation.
- WebSocket handlers update or invalidate the smallest authorized query scope.
- Models are domain-owned; provider DTOs remain behind provider public APIs and mappers translate them into domain contracts.
- Domain code may depend on core contracts, UI, shared contracts, and provider public APIs. Domains must not reach into another domain or provider's private implementation.
- Providers must not import domain views, components, hooks, queries, or routes.
- A component becomes shared only after it has a stable cross-domain use case.
- New polling, Angular compatibility code, and React-to-Angular adapters remain prohibited.

## Design and component strategy

The repository-side audit is recorded in [UI component inventory](ui-component-inventory.md). No `@themodcraft` package is currently installed, so external candidate selection remains pending exact package names and versions.

### Planned inputs

- Run a Portainer 3.x instance as a workflow and information-architecture reference.
- Use selected React and Next.js components owned under the `@themodcraft` npm namespace where they improve consistency or development speed.
- Build a distinct Vessel HQ visual identity rather than cloning Portainer 3.

### Component adoption rules

- Audit each package for React 19, TypeScript, SSR, accessibility, responsive behavior, bundle impact, maintenance status, and license compatibility.
- Reuse framework-neutral React components directly when appropriate.
- Wrap components tied to `next/link`, `next/image`, Next.js routing, server actions, or React Server Components behind small Vessel HQ adapters.
- Do not introduce Next.js solely to consume a component package; Vessel HQ remains a React application unless a separate architecture decision changes that.
- Adopt design tokens and primitives before replacing entire screens, so visual changes remain consistent and reviewable.

The npm settings URL is account-scoped and cannot serve as public package documentation. Record exact package names and versions here when packages are selected.

## Homelab-first responsive product direction

Vessel HQ should be fully usable from a phone and should optimize first for homelab operators rather than assuming a corporate desktop workflow.

Design priorities:

- a compact environment switcher and mobile navigation drawer;
- useful container, stack, image, and environment status at a glance;
- tables that become readable cards or purpose-built compact lists on narrow screens;
- minimum 44-by-44 pixel touch targets for primary interactive controls;
- mobile-safe dialogs, forms, editors, logs, terminals, charts, and destructive-action confirmation;
- persistent or easily reachable primary actions without hiding essential content;
- layouts that work at phone, tablet, laptop, and wide-desktop widths;
- clear empty, loading, reconnecting, partial-failure, and offline states;
- sensible defaults for one-to-ten-node installations while retaining advanced controls;
- accessible focus order, keyboard operation, contrast, zoom, and reduced-motion behavior.

Responsive acceptance must test real workflows, not only screenshots: selecting an environment, checking health, opening logs, starting or stopping a container, editing and deploying a stack, reviewing an error, and recovering from a WebSocket reconnect.

## Proposed delivery order

This sequence is planning context and has not been started:

1. **Foundation complete:** document module boundaries, move boot/shell ownership, and enforce new slices with dependency rules.
2. **Repository inventory complete:** inventory existing UI primitives. External `@themodcraft` candidates remain pending exact package names and versions.
3. **Compatibility foundation complete:** define semantic color, typography, spacing, elevation, breakpoint, motion, focus, and interaction tokens. Final visual values remain open.
4. **In progress:** redesign the shell, environment navigation, mobile navigation, and shared view layout. The phone drawer now has a consistent breakpoint, backdrop, safe-area handling, and reduced-motion-aware timing.
5. **Structural move complete; responsive work pending:** refactor Containers as the first vertical slice and responsive reference implementation.
6. Validate the slice on phone, tablet, desktop, touch, keyboard, slow connections, and reconnect scenarios.
7. Apply the proven domain/view pattern to stacks, images, environments, users, settings, and the remaining domains while extracting provider-specific adapters.
8. Continue selective upstream 2.45 security and bug-fix intake without overwriting Vessel HQ frontend architecture or identity.

## Decisions still open

- Final Docker Hub repository name and tag policy for the first non-transitional Vessel HQ image.
- Exact `@themodcraft` packages and versions to adopt.
- Final visual language after reviewing the Portainer 3 reference instance.
- Supported minimum viewport and browser matrix.
- Whether the current router and build pipeline remain long-term or receive a separate migration proposal.
- The first stable Vessel HQ release number after the WIP line.

No implementation should be inferred from these open items. Record the decision and migration impact before changing production behavior.
