# Vessel HQ product and architecture roadmap

Status: stable `1.3.2` is released; native extensions remain experimental. Future product and design items remain proposals unless explicitly scoped for implementation.

Last updated: November 12, 2026.

November 15 continuation: the [open-issue ledger](open-issue-continuation-2026-11-15.md)
covers all 35 current issues. Compose project portability is now implemented in
the working tree with reviewed import/export and file-revision conflict checks;
remaining runtime acceptance and broader product work are recorded separately.

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

### Current release policy

- Vessel images use `themodcrafttmc/vessel-hq`, mirrored to `ghcr.io/themodcraft-tmc/vessel-hq`; release automation, update discovery and UI links use the Vessel repository.
- Previous stable work is recorded in the [1.3.1 release notes](../releases/1.3.1.md).
  Stable `1.3.2` was released and reissued on October 31; see its
  [release notes and publication record](../releases/1.3.2.md).
- The October 16 [publication record](migration-change-summary.md#2026-10-16-beta-publication-and-verified-docker-hub-mirror) verifies the Docker Hub beta image and its `beta` alias. Previews do not promote `latest`; stable releases use that channel.
- Keep the existing `themodcrafttmc/portainer` repository and its published tags intact. The transitional references above are historical.

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

## Effort-ordered implementation queue — November 11, 2026

### Current cycle and extension follow-up

Working branch: `fix/resource-layout-cycle`, created from `develop` with the
existing working-tree changes preserved. The current cycle focuses on the
desktop resource-page alignment already underway. The maintainer resumed extension
work on November 11 with the administrator settings backend foundation described
below. The completed isolated validation remains a dated result, not work to repeat
automatically or a claim of production activation.

The extension follow-up is planned in this order:

1. Extension settings: the administrator backend foundation now persists namespaced
   public/write-only secret string maps with bounded validation, revision/version
   checks, update/reset and transactional audits. Secret values stay server-side
   and registration responses omit all settings. The administrator editor now
   supports public values, write-only secrets, reload and confirmed reset.
   Package-declared schemas and the beta.2 runtime/SDK settings contract are now implemented with separate public and secret machine grants.
   See the [API contract and limits](../native-extensions.md#administrator-settings-api).
2. Improve complete-set build management: visible status and sanitized logs,
   repeatable source/package identities, serialized builds, retry/cancellation
   and approval rechecks before privileged steps. Failed candidates preserve
   the serving console.
3. Exercise package upload/update, permission changes and revocation, native UI
   slots, topology/traffic and persistent notes. Complete authenticated browser
   checks, combined-extension checks and failure-path regressions, then patch
   confirmed defects and repeat the checks affected by each fix.
4. Address managed service startup, production activation/health/rollback and
   production certificate provisioning/rotation as a later lifecycle phase.
   These remain unimplemented and need their own acceptance and recovery
   criteria; successful candidate tests do not enable them.

This sequencing now guides the resumed extension work; desktop/UI changes remain
a separate scope. See the
[extension design](plugin-system.md) for existing contracts and lifecycle limits.

The maintainer requested working from lower to higher effort. This is a relative
implementation order, not a delivery estimate or evidence of completion. Each
batch needs fresh verification; remote findings stay open until reanalysis.

| Order | Effort | Work and completion evidence |
| --- | --- | --- |
| 1 | Small | Correct stale release/tracking text; fix invalid CSS, namespaced number parsing, explicit test assertions and mutable workflow action references. Run affected tests and workflow validation. |
| 2 | Small–medium | Review extension-tool subprocess paths, temporary directories and builder permissions; resolve the standalone MCP Zod update (#298). Run tooling/security regressions without weakening isolation. |
| 3 | Medium | Repair topology ordering and extension callbacks through authoring sources and reviewed package rebuilds. Preserve digest-bound grants; do not patch approved compiled packages in place. |
| 4 | Medium | Finish images/networks/volumes shared spacing and authenticated desktop/mobile route checks (#241, #299), including the released sidebar/statistics repair. Record actual browser coverage and unavailable environments. |
| 5 | Medium–large | Improve extension settings persistence/build management, activity logs and externally changed container synchronization (#299). Define concrete gaps against existing behavior before implementation; preserve authorization and realtime ownership. |
| 6 | Large | Complete maintained Go module source migrations/publications (#262) and registry/runtime compatibility checks; isolate YAML/toolchain upgrades and remove obsolete compatibility adapters when consumers migrate. |
| 7 | Large | Replace remaining Bootstrap 3 styles, evaluate upstream backports and improve logs, terminal and Compose editing. Preserve supported platform workflows and verify responsive behavior. |
| 8 | Very large | Design and implement managed extension execution/activation/rollback, certificate lifecycle, webhook gateway, HA and remote-environment improvements (#299), with explicit lifecycle and compatibility criteria. |
| 9 | Product design required | Turn #300's portable Compose/CLI workflow discussion, Business Edition capability requests and infrastructure-as-code proposals into scoped requirements before choosing implementations. These broad requests do not yet specify acceptance criteria. |

Issue #264 is an umbrella with historical unchecked boxes; its child status and
the released fixes must be reconciled before treating those boxes as new work.
The October 31 release records supersede the earlier preparation status below.

Current execution: row 1 and row 2's local source changes are implemented; remote
Sonar reanalysis remains outstanding. The new trusted builder, complete-set package
staging, all eight isolated frontend gates and an isolated startup health check
passed. Row 3's graph package `0.3.1` is validated in that candidate; its approved
installed package has not been replaced. Row 4's list/create route spacing and
shared toolbar fixes are implemented. Selected desktop images, networks, volumes
and network-creation fixtures passed browser checks. Other desktop forms, phone
widths and authenticated production coverage remain open because browser control
failed. The separate SDK workspace is available; SDK beta.2 is published from its independent repository. Fresh
results and exact limits are recorded in the
[November 11 validation handoff](migration-change-summary.md#isolated-extension-validation-and-desktop-spacing--november-11-2026).
All #299 items remain in scope, including the request to recreate Business Edition
capabilities. The frontend contains an edition feature map and direct edition checks. Source-backed Git reference and file browsing are now selected by source availability; a complete capability inventory must distinguish existing handlers from absent implementations before broader parity is claimed.

## Dependency compatibility follow-up

- Complete the maintained Go source migrations and module publications tracked
  in #262 before claiming the Docker monolith/Distribution advisory ranges are
  removed. Source preparation for 1.3.2 does not complete that work.
- Finish authenticated production UI/mobile route coverage (#241); local
  component fixtures and a successful build do not complete that audit.
- The 1.3.2 preparation upgrades minimatch to its maintained nonrecursive
  matcher and supplies a scoped CommonJS/glob 7 compatibility adapter. Remove
  the adapter when legacy callable/parsed-segment consumers have migrated.

- Replace the remaining Bootstrap 3 CSS/markup with maintained shared UI styles,
  then remove the end-of-life dependency. Do not load Bootstrap JavaScript in the
  meantime; 3.4.1 has known tooltip/popover XSS advisories.
- Upgrade YAML and Vitest majors in isolated changes with matching peers and
  manifest/snapshot compatibility checks, rather than grouped release hotfixes.
  The 1.3.1 lockfile supplies YAML 1.10.3 to Vite 8 despite its optional
  `yaml: ^2.4.2` peer; restore a matching toolchain peer when isolating/upgrading
  the application parser. Current TypeScript Vite/Vitest config does not depend
  on Vite parsing YAML configuration.

## Target React architecture

The enforced module contract and incremental migration procedure are documented in [Frontend module architecture](frontend-architecture.md). The canonical destination is defined in [Frontend domain and provider architecture](frontend-domain-provider-architecture.md): application boot and routing live in `web-src/core`, product behavior lives in `web-src/domains`, external-system adapters live in `web-src/providers`, and shared presentation converges in `web-src/ui`. `pnpm check:frontend-boundaries` protects those boundaries from invalid dependencies.

Containers is the first migrated vertical slice. Its implementation, lazy routes, public API, and shrinking transitional dependency budget are described in [Containers vertical-slice migration](containers-vertical-slice.md).

The canonical modules now live directly under `web-src/core`, `web-src/domains`, `web-src/providers`, `web-src/shared`, and `web-src/ui`; `web-src/app` remains the Next.js route tree. The obsolete `web-src/legacy` source root and zero-valued compatibility allowlists were removed after all boundary budgets reached zero. Current evidence and the original assignment plan remain recorded in [Frontend refactor progress — September 22, 2026](frontend-refactor-progress-2026-09-22.md) and [Frontend refactor plan — September 23, 2026](frontend-refactor-plan-2026-09-23.md).

The future server-state and streaming model is documented in [Realtime state architecture](realtime-state-architecture.md): TanStack Query remains the authoritative server cache, authorized lifecycle events evolve toward scoped and batched invalidation, and high-frequency logs, terminals, and metrics remain isolated bounded streams. Redux and RTK Query are not planned.

The next refactor organizes each product domain into views, components, models, mappers, services, hooks, and queries. `views` replaces the superseded `pages` term because route-level application surfaces are not limited to a browser page. Services remain explicit TypeScript modules rather than hidden global state containers.

Prefer domain-owned vertical slices:

```text
web-src/
  app/                     Next.js App Router routes and layouts
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

The [October 23 UI alignment audit](ui-alignment-audit-2026-10-23.md) tracks
all 168 route files and the incomplete live review of deployed `1.3.1`.
Finish desktop/mobile page, tab and dialog checks after browser access is
restored; the local registry/footer/table fixes do not close mobile issue #241.

### Planned inputs

- Run a Portainer 3.x instance as a workflow and information-architecture reference.
- Use selected React and Next.js components owned under the `@themodcraft` npm namespace where they improve consistency or development speed.
- Build a distinct Vessel HQ visual identity rather than cloning Portainer 3.

### Component adoption rules

- Audit each package for React 19, TypeScript, SSR, accessibility, responsive behavior, bundle impact, maintenance status, and license compatibility.
- Reuse framework-neutral React components directly when appropriate.
- Wrap components tied to `next/link`, `next/image`, Next.js routing, server actions, or React Server Components behind small Vessel HQ adapters.
- Vessel HQ now uses Next.js App Router; keep framework-specific component integrations behind the appropriate routing and presentation boundaries.
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

## Future add-on and plugin support

Status: experimental implementation started October 15; full platform delivery is not scheduled. Administrator-installed native React extensions are the selected direction, with separately isolated backend services and a dedicated gRPC capability API. The current slice implements `.vesselhq` upload/storage of native UI and declared Linux executable artifacts, persistent registration/approval/revocation, native candidate preview, protected staging/validation tooling, mTLS registration diagnostics, scoped environment metadata reads, and delegated user-authorized Docker stack topology reads through native action slots. A development operator can compile an approved package set in isolation and select its generated modules after integrity/revision checks. An administrator-only notes example demonstrates persistent extension-owned writes, separate read/write grants, optimistic concurrency, and transactional audit. Automatic background orchestration, managed backend startup, additional workload RPCs, production activation, and rollback remain future work. Administrators explicitly trust installed frontend code; native JavaScript is not isolated from the console's browser context. See [current development scope](../native-extensions.md).

Start with one read-only resource tab and scoped grants. Protect core permission/authentication/build inputs with read-only baselines and trusted integrity checks; failed builds or validation leave the active console untouched. Define atomic activation, rollback, emergency disable, fresh approval for additional permissions, and current-policy enforcement on gRPC calls. Checksums protect source integrity, not runtime behavior of trusted UI code. Expand versioned slots and managed Compose/Helm deployment after the reference lifecycle works. Blueprint and Portainer package compatibility are not assumed; iframes are not the selected UI model.

The [standalone Go SDK](../extension-sdk-workspace.md) owns the shared protobuf contract
and handles service mTLS, package verification, deadlines, typed metadata reads
and persistent extension-owned note read/write calls. Independent machine grants,
approval revision checks, transactional metadata audits and optimistic concurrency
protect service notes. A private shared Unix gateway and a no-network container
example avoid per-stack published ports. The stack drawer additionally reads
sanitized Traefik routing labels and bounded live Docker network byte counters. The
October 16 isolated Docker host smoke covered topology, traffic, notes persistence,
permission revocation and non-admin denial; its [dated record](migration-change-summary.md#2026-10-16-node4-production-host-beta-smoke)
does not establish equivalent Swarm, Podman, Kubernetes or ACI coverage.
Future traffic work includes explicitly scoped Traefik request/latency metrics
and Swarm task-level counter sampling. The immutable SDK `v0.1.0-beta.1` is already published under the original module
identity. Future SDK work includes selecting the independent workspace's next module/release identity, production
identity provisioning and rotation, compatibility policy, and additional RPCs
only after their capabilities and grants are designed. Host-only delegated stack
leases remain private, and administrator HTTP storage grants do not imply machine
storage access. General reverse service routing and managed container startup are
still future work.

See the [plugin system proposal](plugin-system.md) for architecture, trust limitations, build/activation gates, acceptance criteria, and open decisions. Implementation requires a separate authorized scope and fresh baseline verification; historical migration notes do not establish readiness. Track this documentation follow-up separately in [Migration changes and draft commit message](migration-change-summary.md).

## Decisions still open

- Exact `@themodcraft` packages and versions to adopt.
- Final visual language after reviewing the Portainer 3 reference instance.
- Supported minimum viewport and browser matrix.
- Long-term maintenance and optimization of the current Next.js App Router and build pipeline.
- The next release scope and promotion criteria after stable `1.3.2`.

No implementation should be inferred from these open items. Record the decision and migration impact before changing production behavior.


### Independent extension SDK workspace follow-up (2026-10-16)

SDK and simple demo authoring sources now live in the [separate SDK workspace](../extension-sdk-workspace.md); Vessel consumes the immutable published beta.1 module without a local replacement. The configured target Git origin is preserved, while Go import identity remains unchanged. Next publication work must explicitly select the new module/release identity and verify proxy/checksum discovery before bumping Vessel. Do not repoint existing beta.1 tags. The UniFi-style React Flow extension and host integration remain in Vessel; installed compiled payloads are separate from authoring examples. Managed runtime, infrastructure writes and production identity lifecycle remain future work.

## Infrastructure as code evaluation (#244)

The [OpenTofu/Pulumi evaluation](iac-integration-evaluation.md) recommends an
optional infrastructure-project workflow with isolated runners, starting with
OpenTofu and keeping Pulumi behind the same job contract. This is evaluated
future work; no provisioning engine is enabled. Plan review, exact-plan apply
approval, state recovery and exclusive resource ownership are prerequisites.


## October 29 security follow-up

[Issue #262](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/262) remains the
owner-visible tracker for the unresolved Docker/Distribution dependency graph.
Choose maintained upstream releases or approved, maintained publication identities
for the CLI/Compose, Kompose and container-image source migrations documented in
[the dependency inventory](../../backend-src/DEPENDENCY_SECURITY.md#alternative-graph-proof--not-shipped-or-published).
Then remove the real old imports/requirements and repeat registry auth/digest,
Docker/Compose/Swarm/Podman/Kubernetes compatibility checks. No module identity
aliases or advisory suppression substitutes for that work. The current
[audit ledger](../security/audit-follow-up-2026-10-29.md) separates fresh results
from historical proof experiments.

## November 12 bounded implementation cycle

The maintainer requested a 40-minute cycle prioritizing an Argo-inspired network
view, Docker stack GitOps and Arcane/Watchtower-style image updates. Authoring now
includes Network Overview 0.4.0's searchable resource tree/inspector, Stack GitOps
0.1.0 with confirmed source synchronization, and Stack image updates 0.1.0 with
registry checks, confirmed repulls and opt-in server-side monitor/automatic jobs.
The host adds separate administrator/scoped capabilities, opaque stack/source
review versions, redacted responses and current-role/grant checks. This is not
complete Argo CD or Arcane parity; runtime diffs, deployment history/rollback,
image-age delay, tag selection and notifications remain future acceptance work.

Build management also gains exclusive ownership, per-gate progress, sanitized
phase events and complete-set development replacement. Managed binaries,
production activation/rollback, certificate lifecycle, HA, webhook provisioning,
remaining Bootstrap replacement, module publications and the other broad backlog
items remain open. They were not all completed by this bounded cycle. Fresh checks
and actual runtime coverage belong to the November 12 migration handoff.

Development launcher repair: the Docker dev instance now uses loopback ports
9000/19443/18000 with explicit overrides, avoiding the existing normal UI's
8000/9443 bindings. The frontend derives its origin from the selected HTTP port.
