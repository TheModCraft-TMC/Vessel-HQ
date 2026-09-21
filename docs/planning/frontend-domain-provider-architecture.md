# Frontend domain and provider architecture

Status: accepted destination architecture as of September 21, 2026.

This decision replaces the generic `features` destination with explicit product domains and external-system providers. It also standardizes `views` as the name for route-level application surfaces; `pages` is intentionally avoided because Vessel HQ is not limited to a web-page mental model.

## Canonical structure

```text
app/
  core/
    composition/                 application assembly and dependency wiring
    query/                       TanStack Query client and cache coordination
    realtime/                    authenticated event and stream coordination
    routing/                     router adapters and guards
    session/                     application session lifecycle

  domains/
    auth/
    environments/
    containers/
    images/
    networks/
    volumes/
    stacks/
    services/
    users/
    teams/
    registries/
    settings/
    templates/
    edge/

  providers/
    infrastructure/
      docker/
      podman/
      kubernetes/
      azure-aci/
      aws-ecs/
      edge-agent/
    remotes/
      docker-hub/
      ghcr/
      aws-ecr/
      azure-acr/
      quay/
      harbor/

  ui/
    components/                  reusable presentation primitives
    layouts/                     shell and reusable application layouts
    tokens/                      themes, spacing, colors, and typography

  shared/
    contracts/                   dependency-light cross-domain contracts
    utilities/                   pure, proven multi-owner utilities
    test-support/                shared test providers, fixtures, and mocks
```

Only directories required by implemented behavior should exist. Product-specific names are preferred over broad vendor folders: use `azure-aci`, `aws-ecs`, `aws-ecr`, and `azure-acr` rather than ambiguous `azure` or `aws` directories.

## Domain shape

```text
app/domains/<domain>/
  index.ts                       deliberate public API
  routes.ts                      route registration and lazy views
  views/                         route-level application composition
  components/                    domain-private presentation
  models/                        domain and view models
  mappers/                       transport/provider-to-domain conversion
  services/                      domain operations and use cases
  queries/                       TanStack Query reads, mutations, and keys
  hooks/                         React orchestration local to the domain
  tests/                         domain-level tests when not colocated
  legacy-imports.json            temporary exact migration ratchet
```

`views` is used instead of `pages`. A view may be rendered in a browser route, desktop shell, embedded panel, or another application surface.

## Provider shape

```text
app/providers/<class>/<provider>/
  index.ts                       public adapter and capability API
  client/                        protocol and SDK communication
  dto/                           provider-native transport shapes
  mappers/                       provider DTO to domain contract conversion
  capabilities/                  supported operations and feature detection
  errors/                        provider-specific error normalization
  tests/                         contract and compatibility tests
```

Infrastructure providers represent execution targets and orchestrators. Remote providers represent registries and external artifact sources. If source-control remotes are introduced later, they receive their own provider class rather than being mixed with image registries.

## Ownership rules

- Domains own user intent, authorization-aware workflows, routes, views, domain models, and cache behavior.
- Infrastructure providers own communication with Docker, Podman, Kubernetes, Azure Container Instances, AWS compute platforms, and edge agents.
- Remote providers own communication with Docker Hub, GHCR, ECR, ACR, Quay, Harbor, and similar services.
- Provider DTOs must not leak into domain views. Provider mappers translate them into stable domain contracts.
- Domains depend on provider public APIs or dependency-light contracts, never provider-private files.
- Providers must not import domain views, components, hooks, queries, or routes.
- Cross-domain imports use the owning domain's `index.ts`; private subpath imports are prohibited.
- `core/composition` selects and wires providers. It contains assembly, not product behavior.
- React context objects are called `contexts`, `bindings`, or `composition`; the word `provider` is reserved for external-system adapters.
- Shared UI belongs in `ui` only after reuse is demonstrated. Domain-specific UI remains with its domain.

## Dependency direction

```text
bootstrap -> core/composition -> domains -> provider public APIs
                            |-> ui

domains -> core contracts, ui, shared, provider public APIs
providers -> shared contracts and external SDKs
ui -> shared contracts only

provider -X-> domain views/components/hooks/queries/routes
domain -X-> provider DTOs or private implementation files
ui -X-> domains or providers
```

Where practical, a domain or shared contract defines the capability required by the application and a provider implements it. This keeps Docker, Podman, Kubernetes, and cloud-specific response shapes from becoming the application's universal model.

## Initial migration map

| Current owner                               | Destination                                                                | Boundary decision                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `app/features/auth`                         | `app/domains/auth`                                                         | Authentication is a product domain.                                                           |
| `app/features/environments`                 | `app/domains/environments`                                                 | Environment identity and lifecycle are domain contracts.                                      |
| `app/features/containers`                   | `app/domains/containers`                                                   | Container workflows remain provider-neutral where capability permits.                         |
| `app/features/azure`                        | Split between `app/domains` and `app/providers/infrastructure/azure-aci`   | Views and workflows are domain-owned; Azure transport, DTOs, and mapping are provider-owned.  |
| `app/react/docker` and `app/docker`         | Docker domains plus `app/providers/infrastructure/docker`                  | User workflows move to domains; Engine API transport and native mapping move to the provider. |
| Podman-specific Docker compatibility code   | `app/providers/infrastructure/podman`                                      | Capability differences are explicit rather than scattered conditionals.                       |
| `app/react/kubernetes` and `app/kubernetes` | Kubernetes-oriented domains plus `app/providers/infrastructure/kubernetes` | Workflows remain domains; Kubernetes API communication is provider code.                      |
| Registry services and native types          | `app/providers/remotes/<provider>`                                         | Each registry adapter normalizes authentication, catalog, repository, and tag behavior.       |
| Registry management views                   | `app/domains/registries`                                                   | Configuration, access, and repository workflows remain a user-facing domain.                  |
| `app/react/components`                      | Owning domain or `app/ui/components`                                       | Promote only proven reusable presentation.                                                    |

## Migration sequence

1. Rename the accepted `app/features` slices to `app/domains` and update architecture enforcement.
2. Standardize new route-level directories as `views`; rename existing `*View` directories incrementally when a complete domain is touched.
3. Extract provider-neutral contracts before moving provider implementations.
4. Establish Docker and registry provider APIs as the first infrastructure and remote examples.
5. Split Azure domain workflows from the Azure Container Instances provider adapter.
6. Extract Podman and Kubernetes adapters behind the same capability boundaries where behavior is actually shared.
7. Continue moving legacy Portainer, React, Docker, and Kubernetes folders one complete workflow at a time.

Every migration checkpoint preserves URLs, permissions, API behavior, cache semantics, and realtime behavior. It must pass boundary enforcement, type checking, focused tests, full lint, and the production build while lowering its exact legacy dependency ratchets.
