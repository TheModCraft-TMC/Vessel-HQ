# Provider migration inventory

Status: repository inventory and migration guide for the accepted domain/provider architecture, September 21, 2026.

This document maps the current frontend implementation to `app/providers/infrastructure` and `app/providers/remotes`. It is deliberately an inventory, not permission to move every platform-named directory wholesale. Current platform trees mix route-level views, user workflows, cache orchestration, transport code, provider-native DTOs, and mappers. Each slice must separate those responsibilities before it moves.

## Classification rule

| Responsibility                                                                                                                                               | Owner                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Routes, authorization-aware workflows, TanStack Query cache behavior, forms, tables, and route-level `views`                                                 | `app/domains/<domain>`                    |
| Protocol URLs, HTTP/SDK calls to an execution target, provider-native request/response DTOs, provider capability detection, and provider error normalization | `app/providers/infrastructure/<provider>` |
| Registry-specific authentication, URL defaults, catalog/repository/tag/manifest transport, and registry capability differences                               | `app/providers/remotes/<provider>`        |
| Portainer's persisted registry configuration, registry access policy, and the registry management UI                                                         | `app/domains/registries`                  |
| Application wiring that selects an adapter for an environment or registry type                                                                               | `app/core/composition`                    |

Query hooks do not move to providers merely because they call an API. A domain query owns cache keys, invalidation, loading behavior, and user-facing errors; it calls a provider client or capability interface for data. Provider modules must not import domain views, hooks, routes, or query caches.

## Infrastructure providers

### Docker

Destination: `app/providers/infrastructure/docker`.

| Current source                                                                                                                             | Destination responsibility                                                                                                                                                                | Keep outside the provider                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `app/react/docker/proxy/queries/buildDockerProxyUrl.ts` and low-level functions below `app/react/docker/proxy/queries/**`                  | `client/` URL construction and Docker Engine proxy operations                                                                                                                             | TanStack Query hooks, keys, invalidation, and notifications stay with the owning domain                                       |
| `app/react/docker/queries/utils/buildDockerUrl.ts` and endpoint-specific request helpers distributed through `app/react/docker/**/queries` | `client/` for Portainer's Docker endpoints when the operation is runtime-specific                                                                                                         | Workflow-specific queries stay in containers, images, networks, volumes, services, secrets, configs, swarm, or stacks domains |
| `docker-types` shapes used directly throughout Docker queries and views                                                                    | `dto/`, initially re-exporting or aliasing upstream native types                                                                                                                          | Domain models should not expose raw Engine responses                                                                          |
| `app/docker/models/**`                                                                                                                     | Split between `dto/`, `mappers/`, and stable domain models; files such as container stats, image details, nodes, tasks, services, networks, and volumes need classification one at a time | Presentation-ready models that encode a user workflow belong to the matching domain                                           |
| `app/docker/helpers/containers.ts` and Docker-native conversions scattered in view/query folders                                           | Pure Engine conversions move to `mappers/`; general form-to-domain conversion remains in a domain                                                                                         | `app/docker/helpers/logHelper/**` should remain domain/shared until its transport ownership is proven                         |
| `app/react/docker/agent/queries/**`                                                                                                        | Docker agent client or `edge-agent` capability, based on the endpoint actually called                                                                                                     | Node selection UI remains domain-owned                                                                                        |

The current Docker surface is the largest coupling hotspot. Repository references include about 154 files importing `@/react/docker` and 73 importing `@/docker`; direct HTTP operations are spread across dozens of workflow query directories. The existing `app/domains/containers` migration must not be reversed: its `*View` components, actions, forms, cache hooks, and request intent remain the container domain. Only native Engine transport and DTO conversion should cross into the Docker provider.

Recommended first slice: move `buildDockerProxyUrl`, the proxy query-key-independent HTTP functions for one read-only resource (for example Engine version or ping), and their native response types behind a small public `DockerClient` contract. Keep the existing hooks in place and change only their data source. This proves dependency direction without moving a route.

### Podman

Destination: `app/providers/infrastructure/podman`.

There is no cohesive Podman client tree today. Podman is treated as Docker-compatible and detected through scattered conditionals. Evidence includes `app/react/portainer/environments/queries/useIsPodman.ts`, the Podman environment wizard under `app/react/portainer/environments/wizard/EnvironmentsCreationView/WizardPodman`, Docker plugin filtering in `app/react/docker/proxy/queries/usePlugins.ts`, networking defaults in `app/domains/containers/CreateView/NetworkTab/toViewModel.ts`, container action capability checks, stats normalization in `app/docker/models/containerStats.ts`, and Podman-specific environment/sidebar labels.

| Current source                                                           | Destination responsibility                                                    | Keep outside the provider                                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `useIsPodman.ts` and platform flags derived from environment metadata    | A provider-selection/capability result exposed by `podman/index.ts`           | Environment query and cache ownership stays in `domains/environments`                 |
| Podman-specific plugin, networking, stats, and action conditionals       | `capabilities/` plus Podman-specific `mappers/` where native behavior differs | Container forms and action UI consume capability values from `domains/containers`     |
| `WizardPodman/**` deployment scripts and socket/agent connection details | Connection/deployment primitives may move to `client/` or capabilities        | Wizard views and environment creation workflow remain in `domains/environments/views` |

Recommended first slice: define a provider-neutral container capability contract and implement only the currently proven differences (`networkMode`, plugin filtering, recreate/duplicate support, and stats normalization). Do not fork the complete Docker client while Portainer intentionally uses Docker-compatible endpoints for Podman.

### Kubernetes

Destination: `app/providers/infrastructure/kubernetes`.

| Current source                                                                                                                                       | Destination responsibility                                                                                                | Keep outside the provider                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `app/kubernetes/rest/**` and direct Kubernetes HTTP functions currently embedded throughout `app/react/kubernetes/**/queries` and `service.ts` files | `client/` operations organized by Kubernetes resource, with normalized errors                                             | TanStack Query hooks, cache keys, mutations, notifications, and authorization stay in domains                |
| `app/kubernetes/models/**`                                                                                                                           | Provider-native API objects and payloads move to `dto/`; form values and stable application concepts remain domain models | Do not move the directory as a unit because it contains both transport payloads and UI form state            |
| `app/kubernetes/converters/**`                                                                                                                       | Native Kubernetes response/request conversions move to `mappers/`                                                         | Workflow summaries or table-row conversion remain with the owning domain                                     |
| `app/react/kubernetes/queries/**`, metrics transport, Helm transport, and resource YAML operations                                                   | Underlying calls move to `client/`; version and API support checks move to `capabilities/`                                | Hooks stay with cluster, applications, namespaces, configuration, ingress, storage, access, and Helm domains |
| `app/react/kubernetes/**View`, `app/kubernetes/views/**`, and `app/kubernetes/react/views/route-components.ts`                                       | No provider destination                                                                                                   | These are domain `views`, legacy wrappers, and route composition                                             |

Kubernetes is another major hotspot: about 141 files import `@/react/kubernetes`, 53 import `@/kubernetes`, and direct HTTP calls are spread across more than one hundred files under `app/react/kubernetes`. Its model directory also mixes API payloads with form values. A bulk directory move would preserve rather than fix the coupling.

Recommended first slice: extract the read-only Kubernetes version operation from `app/react/kubernetes/queries/useKubernetesVersion.ts`. Put the HTTP call and native response DTO behind the provider public API while leaving the hook and its query key in the cluster domain. Follow with one coherent resource family such as events; do not start with applications or namespaces, whose access, forms, quotas, and registry relationships are much broader.

### Azure Container Instances

Destination: `app/providers/infrastructure/azure-aci`.

The temporary Azure slice under `app/domains/azure` (formerly `app/features/azure`) still combines domain views with Azure Resource Manager transport.

| Current source                                                                                                                        | Destination responsibility                                                                                               | Keep outside the provider                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `app/domains/azure/services/azure-urls.ts`, `container-groups.service.ts`, and transport utilities                                    | `client/` for ACI/ARM requests through the environment proxy                                                             | Create/delete workflow orchestration stays in the container domain                                         |
| `app/domains/azure/queries/useProvider.ts`, `useSubscriptions.ts`, `useResourceGroups.ts`, `useContainerGroups.ts`, and item variants | Extract their HTTP fetchers and Azure-native DTOs to the provider                                                        | Hooks, cache keys, loading states, and invalidation stay domain-owned                                      |
| `app/domains/azure/types.ts`                                                                                                          | Split Azure subscription/resource-group/container-group shapes into `dto/`; stable workload/form models go to the domain | Avoid exporting ARM response shapes from a domain public API                                               |
| `app/domains/azure/services/container-groups.service.ts::transformToPayload`                                                          | `mappers/` because it constructs an ACI-native container-group payload                                                   | Form validation and form values remain with the view/workflow                                              |
| `DashboardView/**` and `container-instances/{CreateView,ItemView,ListView}/**`                                                        | No provider destination                                                                                                  | These remain domain views, preferably under the container workload domain once the adapter boundary exists |
| Azure environment forms and wizard code under `app/react/portainer/environments/**`                                                   | Azure connection fields/capability details may call the adapter                                                          | Route-level environment setup remains in `domains/environments/views`                                      |

Recommended first slice: move the URL builders, ACI DTOs, `transformToPayload`, and the already-tested container-group service behind an `AzureAciClient`. Existing queries and mutations can call it without changing cache semantics or route ownership.

### Edge agent

Destination: `app/providers/infrastructure/edge-agent`.

`app/react/edge` is mostly product workflow code, not an infrastructure adapter. Edge groups, jobs, stacks, device waiting-room behavior, association tables, and their route views belong to edge-oriented domains. The narrower provider boundary is agent enrollment and communication.

| Current source                                                                                                                           | Destination responsibility                                              | Keep outside the provider                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `app/react/edge/components/EdgeScriptForm/scripts.ts`, connectivity test logic, agent script parameters, and agent communication details | `client/`, `dto/`, and `capabilities/` for agent bootstrap/connectivity | Form rendering and user decisions remain domain components                                                |
| `app/react/portainer/environments/environment.service/edge.ts`, `queries/useAgentDetails.ts`, and agent-version queries                  | Low-level edge-agent operations and native responses                    | Environment cache/query ownership stays in `domains/environments`                                         |
| Edge agent forms and deployment widgets under `app/react/portainer/environments/**`                                                      | Provider-specific fields consume the public adapter                     | Environment creation and editing remain domain views                                                      |
| `app/react/edge/edge-groups`, `edge-jobs`, `edge-stacks`, and `edge-devices`                                                             | No provider destination                                                 | These are user workflows, models, queries, components, and views; move to the appropriate domain boundary |
| `app/edge/__module.js` and `app/edge/react/views/route-components.ts`                                                                    | No provider destination                                                 | Legacy route registration migrates to domain routes/core routing                                          |

Recommended first slice: extract deployment-script generation as a pure, contract-tested capability, then extract the connectivity-test request. Both are bounded and already have nearby tests; neither requires moving edge job/stack/group routes.

## Remote providers

The registry system currently centralizes all registry kinds in `app/react/portainer/registries/types/registry.ts`, `RegistryForm.tsx`, `utils/**`, `app/portainer/models/registry.js`, and `app/portainer/models/registryTypes.js`. `RegistryTypes` explicitly distinguishes Docker Hub, Quay, Azure, ECR, and GitHub Container Registry. Repository, tag, blob, and manifest operations live below `app/react/portainer/registries/repositories`; persisted registry CRUD and access policies live alongside them.

The split must preserve one important distinction:

- `domains/registries` owns saved registry records, environment/namespace access, list/create/edit views, query keys, and workflow errors.
- `providers/remotes/*` own each remote's URL defaults, credential semantics, capabilities, and normalized catalog/repository/tag/manifest operations.

| Target provider | Current evidence and paths                                                                                                                                                                                   | Provider-owned extraction                                                                                                                                 | Domain-owned remainder                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `docker-hub`    | `RegistryTypes.DOCKERHUB`; `app/portainer/models/dockerhub.js`; `CreateView/RegistryFormDockerhub/**`; anonymous default insertion in `queries/useRegistries.ts`; `docker.io` defaults in `RegistryForm.tsx` | URL normalization, anonymous/authenticated credential behavior, rate-limit/capability metadata, catalog/repository/tag transport                          | Docker Hub form/view, saved-record lifecycle, default-registry policy                                             |
| `ghcr`          | `RegistryTypes.GITHUB`; `ghcr.io` default and organization handling in `RegistryForm.tsx`; `Github` shape in registry types/model                                                                            | Host default, token/organization rules, repository/tag/manifest adapter                                                                                   | Selection forms and persisted registry configuration                                                              |
| `aws-ecr`       | `RegistryTypes.ECR`; `Ecr.Region`; ECR authentication labels and defaults in registry form/model; AWS ECR legacy form under `app/portainer/components/forms/registry-form-aws-ecr`                           | Region-aware endpoint/authentication, token-expiry semantics, catalog/repository/tag adapter                                                              | Region input view and saved-record/access workflow                                                                |
| `azure-acr`     | `RegistryTypes.AZURE`; Azure registry form under `app/portainer/components/forms/registry-form-azure`; generic authenticated-registry behavior in the central model                                          | ACR host/credential rules and repository/tag adapter                                                                                                      | Configuration and access views; do not mix this with the `azure-aci` infrastructure provider                      |
| `quay`          | `RegistryTypes.QUAY`; `Quay` organization fields; `quay.io` default; Quay legacy form                                                                                                                        | Organization/authentication rules, host default, repository/tag/manifest adapter                                                                          | Organization form and saved-record workflow                                                                       |
| `harbor`        | No Harbor-specific registry enum, client, DTO, or form was found; Harbor currently falls through the custom-registry path if used                                                                            | Add an adapter only after a tested Harbor-specific capability is required; start from the generic OCI/Registry behavior rather than inventing differences | Continue treating ordinary Harbor configuration as a custom registry until product behavior needs a distinct type |

The common repository transport currently includes `repositories/ListView/useRepositoryTags.ts`, `repositories/queries/getRegistryBlobs.ts`, `manifest.service.ts`, and tag-detail queries. Extract a provider-neutral remote registry interface before copying this code into six folders. Provider implementations should share an internal OCI/Distribution client where behavior is genuinely identical, while provider-specific authentication and pagination remain explicit.

GitLab, ProGet, and custom registries also exist in the current registry enum and UI but are outside the six accepted first-class destinations above. They must remain supported. Keep them in the registry domain/generic adapter until a separate architecture decision names their provider destinations.

## Dependency hotspots

1. **Provider-native types leak into views.** `docker-types` and Kubernetes model/payload objects are consumed directly by hooks, forms, and tables. Introduce mapped domain contracts before tightening import rules.
2. **Transport and cache orchestration share files.** Many query hooks call `axios` directly. Extract the HTTP function first and leave the hook, key, invalidation, and notifications in the domain.
3. **Environment identity is a universal dependency.** Docker, Kubernetes, Azure ACI, Podman, and edge-agent calls all depend on `EnvironmentId` and environment platform metadata. Providers may depend on the public environment contract, never environment views or private queries.
4. **Registry kind branching is centralized.** `RegistryForm.tsx`, the legacy registry model, image utilities, and image-selection components switch on `RegistryTypes`. Move defaults and capabilities behind a registry adapter before splitting UI folders.
5. **Podman has no physical boundary.** Its behavior is encoded as exceptions inside Docker and environment code. Capability extraction must precede file relocation.
6. **Azure names are ambiguous.** Azure ACI executes workloads; Azure ACR stores images. They must never share a provider directory or generic Azure client facade.
7. **Edge is broader than edge-agent transport.** Moving `app/react/edge` wholesale into the provider layer would invert dependencies and put product workflows under infrastructure.
8. **Legacy route ownership remains separate.** `app/docker/__module.js`, `app/kubernetes/**/route-components`, and `app/edge/__module.js` register views; provider extraction must not change URLs or authorization metadata.

## Low-risk migration order

1. Introduce provider public interfaces and contract tests without changing routes or hook APIs.
2. Extract Docker URL construction plus read-only ping/version transport; keep hooks in their current domain.
3. Extract Azure ACI URL builders, DTOs, payload mapper, and container-group client using the existing service tests.
4. Extract edge-agent deployment-script generation and connectivity-test transport.
5. Introduce a remote registry capability interface, then move provider defaults and authentication mapping for Docker Hub and GHCR.
6. Move ECR, ACR, and Quay special cases after shared registry behavior is covered; keep Harbor on the generic adapter until a real distinction exists.
7. Extract Kubernetes version and events, then migrate one Kubernetes resource family at a time.
8. Replace scattered Podman booleans with explicit capabilities; create additional Podman client code only where runtime behavior actually differs.

Each step should leave a compatibility re-export only when callers cannot be migrated atomically. Every compatibility path receives an exact import-count ratchet and a deletion condition.

## Validation gates

Every provider slice must satisfy all of the following before merge:

- The provider public API contains no React component, hook, TanStack Query key, router state, notification, or domain view import.
- Domain views and services do not import provider-private `client`, `dto`, `mappers`, `capabilities`, or `errors` paths; they import the provider `index.ts` only.
- Provider DTOs do not appear in domain public APIs or view props. Boundary tests demonstrate DTO-to-domain mapping.
- Existing route URLs, authorization declarations, environment selection, cache keys, invalidation, and realtime update behavior are unchanged unless separately specified.
- Docker and Podman contract tests run against the same provider-neutral capability suite, with explicit expected differences.
- Registry contract tests cover URL normalization, anonymous/authenticated behavior, organization/region fields, pagination, manifests, and normalized errors for every implemented remote.
- Azure ACI and Azure ACR tests prove that compute and registry credentials/types do not cross their provider boundaries.
- Focused unit/query tests, architecture boundary checks, TypeScript checking, lint, and the production build pass.
- The exact legacy-import budget decreases; a migration may not broaden its allowlist or replace a direct legacy dependency with a new deep import.
- A repository search shows no newly introduced direct `axios`/SDK calls in domain views or components.

## Completion criteria

The provider migration is complete when platform selection occurs in `core/composition`, domains express user intent through stable capability contracts, all provider-native transport and DTO conversion lives behind provider public APIs, and no provider imports domain UI or cache orchestration. Legacy platform roots may then be removed after their route/workflow owners have migrated independently.
