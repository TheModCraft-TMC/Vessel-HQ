# Frontend domain schema

Status: superseded on September 21, 2026 by [Frontend domain and provider architecture](frontend-domain-provider-architecture.md). This document remains the migration history for the first domain-boundary checkpoints.

The old frontend tree records several generations of the application at once. `app/azure`, `app/docker`, `app/edge`, `app/kubernetes`, and `app/portainer` began as product or platform namespaces. `app/react` was then added as a migration namespace while React route-level UI was mounted from the older shell. This made framework (`react`), platform (`azure`, `docker`, `kubernetes`), and product (`portainer`) names compete at the same level.

The destination is domain-first. React is an implementation detail, Portainer is the upstream history, and platform names are used only when the user workflow is genuinely platform-specific.

## Superseded feature-era checkpoint

The following tree records the first migration checkpoint. Its `features`, `pages`, `design-system`, and top-level `layouts` names are superseded. The canonical destination is now `app/domains`, `app/providers`, and `app/ui`, with route-level UI named `views`; see [Frontend domain and provider architecture](frontend-domain-provider-architecture.md).

```text
app/
  core/                         application boot and runtime infrastructure
    query/                      QueryClient and cache coordination
    realtime/                   authenticated live-event coordination
    routing/                    router adapters and route guards
  design-system/                tokens and reusable UI primitives
  layouts/                      shell, navigation, and page composition
  features/
    auth/                       sign-in and session workflows
    account/                    current-user settings and access tokens
    environments/               environment lifecycle and grouping
    users/                      users, roles, and effective access
    teams/                      teams and memberships
    registries/                 registry and repository workflows
    settings/                   installation and authentication settings
    templates/                  application and custom templates
    containers/                 Docker container workflows
    images/                     image workflows
    networks/                   network workflows
    volumes/                    volume workflows
    stacks/                     stack and Compose workflows
    services/                   Swarm service workflows
    configs/                    Swarm config workflows
    secrets/                    Swarm secret workflows
    swarm/                      cluster-scoped Swarm workflows
    azure/                      Azure Container Instances workflows
    edge/                       edge-device, group, job, and stack workflows
    kubernetes/                 Kubernetes workflows, subdivided by domain
  shared/                       non-UI contracts with proven multi-domain use
  test-support/                 test-only providers, fixtures, and mocks
```

At this checkpoint, `shared` and `test-support` were destinations rather than dumping grounds. That ownership rule remains: a module stays with its owning domain until a stable multi-domain use case exists. Reusable visual primitives now converge in `app/ui`; application lifecycle belongs in `app/core`; external-system adapters belong in `app/providers`.

## Canonical domain shape

```text
app/domains/<domain>/
  index.ts                      public API; the only cross-domain entry point
  routes.ts                     route registration and lazy views
  views/                        route-level application composition
  components/                   domain-private presentation
  services/                     framework-independent domain operations
  queries/                      React Query keys, reads, mutations, invalidation
  models/                       domain and view models
  mappers/                      provider-to-domain conversion
  hooks/                        React orchestration local to the domain
  tests/                        domain-level tests when colocation is unsuitable
  legacy-imports.json           temporary, exact dependency-reduction ratchet
```

Folders are created only when a domain needs them. Existing route-level names may remain during the first behavior-preserving move, then converge on `views` when the complete domain is touched. Provider clients, native DTOs, capability detection, and provider-specific errors use the corresponding `app/providers/infrastructure/<provider>` or `app/providers/remotes/<provider>` boundary.

## Dependency direction

```text
bootstrap -> core/composition -> public domain APIs -> provider public APIs
                              -> ui

domain -> core contracts, ui, shared, provider public APIs
domain -> another domain's index.ts only
providers -> shared contracts and external SDKs
queries -> services + models
views/hooks -> queries + components
services/models -X-> React, query state, views, hooks, components
provider -X-> domain views/components/hooks/queries/routes
ui -X-> domains, providers, or legacy app code
```

## Migration map

| Legacy source                                           | Destination                                                                                                              | Strategy                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `app/react/portainer/auth` + authentication routes      | `app/domains/auth`                                                                                                       | Complete structural move; all consumers use its public API and its frozen legacy budget can only decrease.      |
| `app/react/azure` + `app/azure`                         | Product domains plus `app/providers/infrastructure/azure-aci`                                                            | Split workflows and views from Azure transport, DTOs, capability handling, and mapping.                         |
| `app/react/docker/containers` + container routes        | `app/domains/containers` plus `app/providers/infrastructure/docker`                                                      | Keep container intent provider-neutral while moving Docker Engine details behind the provider API.              |
| `app/react/portainer/environments/types.ts`             | `app/domains/environments`                                                                                               | Shared contract extracted; all consumers use the public API while queries, services, routes, and views migrate. |
| Remaining `app/react/docker/*` + `app/docker/*`         | Docker domains plus `app/providers/infrastructure/docker`                                                                | Move one complete workflow at a time; do not create a product-domain umbrella named for Docker.                 |
| `app/react/edge` + `app/edge`                           | Product domains plus `app/providers/infrastructure/edge-agent`                                                           | Separate device, group, job, and stack workflows from agent communication.                                      |
| `app/react/kubernetes` + `app/kubernetes`               | Product domains plus `app/providers/infrastructure/kubernetes`                                                           | Separate application intent and views from Kubernetes-native communication and DTOs.                            |
| `app/react/portainer/*` + `app/portainer/*`             | Product domains such as `environments`, `users`, `teams`, `registries`, `settings`, `templates`, `account`, and `gitops` | Never create `domains/portainer`; the upstream brand is not a domain.                                           |
| Registry-native services and types                      | `app/providers/remotes/<provider>`                                                                                       | Normalize Docker Hub, GHCR, ECR, ACR, Quay, and Harbor behavior behind explicit adapter APIs.                   |
| `app/react/components`                                  | `app/ui/components` or the owning domain                                                                                 | Promote only genuinely reusable presentation.                                                                   |
| `app/react/hooks`, `common`, `utils`, and `react-tools` | `core`, `shared`, `test-support`, or the owning domain                                                                   | Decide by responsibility, not by file type.                                                                     |

## Execution order

1. Rename accepted feature-era checkpoints to `app/domains`, update imports and enforcement, and continue dependency reduction without behavior changes.
2. Continue extracting environment and access-control contracts because most other domains depend on them.
3. Migrate Docker workflows individually, starting with the lowest-coupled domain.
4. Migrate account, users, teams, registries, templates, settings, and GitOps out of the Portainer umbrella.
5. Establish Docker and registry providers, then split Azure, Edge, and Kubernetes workflows from their external-system adapters.
6. Promote shared UI and utilities only as repeated usage proves ownership; call route-level application surfaces `views`.
7. Remove empty legacy roots and tighten the architecture checker after each completed slice.

Every slice preserves URLs, permissions, cache semantics, and realtime behavior; passes type checking, architecture checks, focused tests, lint, and production build; and lowers its legacy dependency budget whenever coupling is removed.
