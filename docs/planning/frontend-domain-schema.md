# Frontend domain schema

Status: accepted destination structure as of September 21, 2026.

The old frontend tree records several generations of the application at once. `app/azure`, `app/docker`, `app/edge`, `app/kubernetes`, and `app/portainer` began as product or platform namespaces. `app/react` was then added as a migration namespace while React pages were mounted from the older shell. This made framework (`react`), platform (`azure`, `docker`, `kubernetes`), and product (`portainer`) names compete at the same level.

The destination is domain-first. React is an implementation detail, Portainer is the upstream history, and platform names are used only when the user workflow is genuinely platform-specific.

## Canonical tree

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

`shared` and `test-support` are destinations, not dumping grounds. A module stays with its owning feature until a stable multi-domain use case exists. Reusable visual primitives belong in `design-system`; application lifecycle belongs in `core`; layout composition belongs in `layouts`.

## Feature shape

```text
app/features/<domain>/
  index.ts                      public API; the only cross-feature entry point
  routes.ts                     route registration and lazy route components
  pages/                        route-level composition
  components/                   feature-private presentation
  services/                     framework-independent API/domain operations
  queries/                      React Query keys, reads, mutations, invalidation
  models/                       DTOs and domain/view models
  hooks/                        React orchestration local to the feature
  tests/                        feature-level tests when colocation is unsuitable
  legacy-imports.json           temporary, exact dependency-reduction ratchet
```

Folders are created only when a feature needs them. Existing view names may remain during the first behavior-preserving move, then converge on this shape.

## Dependency direction

```text
bootstrap -> core -> public feature APIs
                 -> layouts -> design-system

feature -> core, layouts, design-system
feature -> another feature's index.ts only
queries -> services + models
pages/hooks -> queries + components
services/models -X-> React, query state, pages, hooks, components
design-system -X-> application features or legacy app code
```

## Migration map

| Legacy source                                           | Destination                                                                                                                     | Strategy                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `app/react/portainer/auth` + authentication routes      | `app/features/auth`                                                                                                             | Complete structural move; all consumers use its public API and its frozen legacy budget can only decrease.          |
| `app/react/azure` + `app/azure`                         | `app/features/azure`                                                                                                            | Complete structural move; reduce its frozen legacy imports next.                                                    |
| `app/react/docker/containers` + container routes        | `app/features/containers`                                                                                                       | Complete structural move; reduce its frozen legacy imports and make views responsive.                               |
| Remaining `app/react/docker/*` + `app/docker/*`         | Docker domains such as `images`, `networks`, `volumes`, `stacks`, `services`, `configs`, `secrets`, and `swarm`                 | Move one complete workflow at a time; do not create a new `features/docker` umbrella.                               |
| `app/react/edge` + `app/edge`                           | `app/features/edge` initially                                                                                                   | Preserve the platform boundary, then split devices, groups, jobs, and stacks when their public contracts are clear. |
| `app/react/kubernetes` + `app/kubernetes`               | `app/features/kubernetes` initially                                                                                             | Preserve the platform boundary, then split applications, cluster, namespaces, access, and storage internally.       |
| `app/react/portainer/*` + `app/portainer/*`             | Actual product domains such as `environments`, `users`, `teams`, `registries`, `settings`, `templates`, `account`, and `gitops` | Never create `features/portainer`; the brand is not a domain.                                                       |
| `app/react/components`                                  | `app/design-system` or the owning feature                                                                                       | Promote only genuinely reusable UI.                                                                                 |
| `app/react/hooks`, `common`, `utils`, and `react-tools` | `core`, `shared`, `test-support`, or the owning feature                                                                         | Decide by responsibility, not by file type.                                                                         |

## Execution order

1. Continue Azure, Containers, and Authentication dependency reduction without behavior changes.
2. Extract environment and access-control contracts because most other domains depend on them.
3. Migrate Docker workflows individually, starting with the lowest-coupled domain.
4. Migrate account, users, teams, registries, templates, settings, and GitOps out of the Portainer umbrella.
5. Move Edge, then Kubernetes, retaining internal platform subdivisions until their contracts stabilize.
6. Promote shared UI and utilities only as repeated usage proves ownership.
7. Remove empty legacy roots and tighten the architecture checker after each completed slice.

Every slice preserves URLs, permissions, cache semantics, and realtime behavior; passes type checking, architecture checks, focused tests, lint, and production build; and lowers its legacy dependency budget whenever coupling is removed.
