# Frontend refactor execution plan

Status: approved architecture; execution sequence proposed September 21, 2026.

This plan turns the accepted domain/provider architecture into small, behavior-preserving migration batches. It deliberately prioritizes structural work over product features. URLs, authorization, cache behavior, API payloads, realtime behavior, and supported environments remain unchanged unless a separate decision explicitly changes them.

## Working rule

Refactor one coherent workflow vertically instead of moving one file type across the entire application.

```text
domain contract/models
  -> provider DTO/client (when an external system is involved)
  -> mappers
  -> domain services/use cases
  -> queries and hooks
  -> components
  -> views and routes
  -> compatibility removal and boundary ratchet
```

This order makes each checkpoint usable and testable. A repository-wide "move all models, then all services" pass would leave temporary coupling everywhere and make regressions difficult to isolate.

## Current baseline

The canonical roots and boundary checker are in place. The first domain and provider slices are present:

- domains: `auth`, `azure`, `containers`, `environments`, and `tags`;
- infrastructure providers: `docker` and `azure-aci`;
- core ownership: query, routing, and realtime coordination;
- terminology: route-level application surfaces are `views`, not `pages`;
- transitional import budgets: Environments `1`, Auth `27`, Azure `73`, Containers `492`.

The legacy surface is still large: the environment workflow has about 247 files, the React Docker tree about 393 files, the older Docker tree about 35 files, registries about 72 files, and the shared React component tree about 491 files. These counts are migration signals, not success metrics. Success is a smaller dependency surface with unchanged behavior.

## Phase 1: close the environment contract boundary

Goal: reduce the Environments legacy budget from `1` to `0` and establish a dependency-light environment model.

1. Split the Docker snapshot types by responsibility.
   - Keep the environment-facing snapshot summary in `domains/environments/models`.
   - Keep Docker-native/raw snapshot transport shapes in the Docker provider.
   - Avoid importing Container view models into the Environment public contract.
2. Add focused contract/type tests where conversion is required.
3. Retain a temporary legacy re-export only if unmigrated callers cannot move in the same commit.
4. Delete `domains/environments/legacy-imports.json` when the budget reaches zero.

Exit gate: Environments has a deliberate public API and no dependency on `app/react`, `app/docker`, or `app/portainer`.

## Phase 2: finish Auth as the reference domain

Goal: reduce the Auth legacy budget from `27` to `0` and make Auth the example for domain layout and session ownership.

Commit-sized batches:

1. **Models and mappers**
   - Define credentials, authenticated principal, and session result models.
   - Map generated API/current-user responses at the boundary instead of exposing legacy response types.
2. **Session dependencies**
   - Move authentication storage and session lifecycle into `core/session`.
   - Keep realtime start/stop coordination in `core/realtime`.
   - Extract theme application as a core/UI concern rather than an Auth service dependency.
3. **Services**
   - Make Auth services depend on generated API clients, stable session contracts, and shared HTTP error normalization only.
   - Remove dependencies on legacy app state, user query modules, storage, and Axios helpers.
4. **Components and views**
   - Move Auth-specific form presentation into `domains/auth/components`.
   - Promote only genuinely reusable primitives needed by Auth into `ui/components`.
   - Keep `LoginView`, `LogoutView`, and route ownership in the domain.
5. **Close the boundary**
   - Route all external consumers through `domains/auth/index.ts`.
   - Remove the Auth allowlist after its final legacy import disappears.

Exit gate: Auth services are framework-independent, Auth views import no legacy modules, and login/logout/OAuth/session restoration tests cover the unchanged behavior.

## Phase 3: migrate the environment read path and Home view

Goal: move the most common application entry path behind the Environments domain before migrating environment creation and administration.

1. Move environment query keys and read-only service operations.
2. Move list/detail queries and provider-neutral environment mapping.
3. Move the Home environment list, cards, filtering, grouping, and status presentation into `domains/environments`.
4. Move reusable environment selection hooks behind the domain public API.
5. Register Home/list/detail views through domain-owned routes without changing URLs or guards.
6. Leave environment creation, Edge enrollment, update schedules, and access-control editing for later sub-slices.

Exit gate: Home to environment navigation, filtering, environment selection, dashboard entry, browser history, and authorization are covered by focused tests and a live browser smoke test.

## Phase 4: expand the Docker provider and drain Containers incrementally

Goal: move Docker Engine communication and native DTOs behind the provider while keeping container workflows domain-owned.

The order is intentionally read-first and low-risk-first:

1. **Provider system contract**: finish ping, version, info, and capability operations; wire them through composition.
2. **Container list**: move list transport, native DTOs, and DTO-to-domain mapping; preserve query keys and table behavior.
3. **Container detail**: inspect/top and stable detail models.
4. **Lifecycle actions**: start, stop, restart, pause, resume, kill, remove, rename, and recreate.
5. **Create/edit workflow**: request models and mappers by form section, retaining the current validation behavior.
6. **Related resource boundaries**: replace direct network, image, volume, registry, webhook, and access-control imports with public domain/provider APIs.
7. **Streams last**: logs, console, exec, and statistics use bounded stream adapters and are not placed in the global query cache per frame.

After every batch, lower `domains/containers/legacy-imports.json`; never expand it. Do not move TanStack Query hooks or React state into the provider.

Exit gate: container views depend on stable domain models, provider DTOs do not reach view props, and the Containers budget reaches zero workflow by workflow.

## Phase 5: finish the Azure ACI split

Goal: reduce the Azure budget from `73` to `0` and remove DTO leakage from the existing first provider adapter.

1. Move subscription and resource-group transport into `providers/infrastructure/azure-aci/client`.
2. Keep ARM DTOs private to the provider and add provider-to-domain mappers.
3. Replace domain usage of `AzureContainerGroupDto` with stable workload models.
4. Consolidate create/list/detail services and queries around the provider public API.
5. Move route surfaces under `views` when each workflow is touched.
6. Replace access-control and UI legacy imports through their eventual public boundaries.

Exit gate: Azure ACI domain code has no ARM transport types, direct Axios calls, or legacy imports. Azure ACI and Azure ACR remain separate providers.

## Phase 6: registries and remote providers

Goal: establish `domains/registries` and provider-neutral remote registry capabilities before copying provider-specific behavior.

1. Define saved-registry, repository, tag, manifest, and credential intent models in the Registries domain.
2. Extract a shared internal OCI/Distribution client where the wire behavior is genuinely common.
3. Implement Docker Hub and GHCR adapters first.
4. Add AWS ECR, Azure ACR, and Quay adapters with explicit authentication and endpoint rules.
5. Keep custom registries, GitLab, ProGet, and ordinary Harbor usage on the generic adapter until a tested behavior requires a dedicated provider.
6. Move registry management and repository views into the domain without changing persistence or access policies.

Exit gate: domain code selects a remote capability through composition and does not branch directly on provider-native transport details.

## Phase 7: Podman capabilities

Goal: replace scattered `isPodman` conditionals with an explicit infrastructure capability model.

1. Inventory each Docker/Podman behavioral difference.
2. Add provider-neutral capability contracts and contract tests shared by Docker and Podman.
3. Create a Podman adapter only for operations whose behavior actually differs.
4. Keep compatible Docker API operations shared instead of duplicating clients.

Exit gate: views ask for capabilities, not provider names, and Docker/Podman expected differences are contract-tested.

## Phase 8: repeat the proven pattern

Once Auth, Environments, Containers, Azure ACI, and Registries are clean reference slices, apply the same sequence to:

1. images, networks, volumes, stacks, and Swarm services;
2. users, teams, settings, templates, and GitOps;
3. edge workflows plus the narrower `edge-agent` provider;
4. Kubernetes, starting with version and events before broader resource families.

Kubernetes remains late because its models currently mix API DTOs, form state, access policy, and view models. A bulk move would preserve that coupling instead of fixing it.

## Continuous UI track

UI migration follows domain demand rather than running as a separate 491-file move.

- Domain-specific presentation stays under its domain.
- Promote a component to `ui/components` only after at least two real owners need a stable, provider-free API.
- Start with Link, Button, form controls, status, dialog, and table shells used by the active slice.
- Keep semantic tokens in `ui/tokens`; visual redesign is not part of these structural batches.
- Rename route-level directories to `views` when their owning workflow migrates.

## Efficient parallel execution

Parallel work is safe only across non-overlapping ownership areas.

- **Primary slice lane** owns production moves and public APIs for one domain.
- **Provider lane** can build a contract-tested adapter after the domain contract is frozen.
- **Verification lane** can add focused regression tests, inventory callers, and update migration documentation.
- Only one lane edits a domain `index.ts`, route registration, import ratchet, or shared compatibility re-export at a time.
- Merge provider work before the domain switches consumers to it; remove compatibility exports only after all dependent lanes have rebased.

Keep commits independently buildable. A useful target is one contract or one workflow per commit, not one directory per commit.

## Validation gate for every batch

Each batch must pass:

1. focused unit/query/component tests for the moved workflow;
2. `pnpm typecheck`;
3. `pnpm check:frontend-boundaries`;
4. targeted ESLint and Prettier checks;
5. `pnpm run build` at each completed workflow checkpoint;
6. route/navigation smoke tests for any moved view;
7. a lower or unchanged exact legacy-import budget, with unchanged allowed modules prohibited;
8. a repository search proving no new direct transport or private deep imports were introduced.

Run the full frontend suite before pushing a multi-workflow milestone and before merging the branch.

## Immediate next milestone

The next implementation milestone is:

1. eliminate the one remaining Environments legacy snapshot import;
2. complete Auth models/session/services/components and reduce its budget to zero;
3. migrate the environment read path and Home view;
4. then begin the Docker container-list provider slice.

No new product features or realtime protocol expansion should start before this milestone is complete. Bug fixes remain allowed and should include regression coverage.
