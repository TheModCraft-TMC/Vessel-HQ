# React and realtime frontend modernization

Status: React-only migration baseline completed on September 20, 2026; realtime scope refinement remains incremental.

The original delivery phases below are retained as architecture history and as the specification for remaining realtime hardening. AngularJS, hybrid routing, React-to-Angular adapters, legacy route ownership, and production frontend polling have reached zero. Current product and refactor plans are maintained in [Vessel HQ product and architecture roadmap](vessel-hq-roadmap.md).

## Outcomes

1. React owns application startup, routing, layouts, views, and shared UI state.
2. AngularJS, the hybrid router, Angular templates, and React-to-Angular adapters are removed from production and development dependencies.
3. Screens obtain their initial state through an HTTP query and remain current through authenticated WebSocket events.
4. Production frontend data polling is removed. Timers used for interaction behavior, WebSocket heartbeat/reconnect, and tests are outside this rule.

Backend Git source polling, Edge check-ins, and other scheduled server work are not frontend polling and are not part of this removal.

## Architecture

React Query remains the owner of server state. WebSocket handling must update or invalidate that cache rather than introduce a second live-data store.

```text
initial HTTP snapshot ──────────────> React Query cache ──> React views
                                            ^
Docker events ───────┐                       |
Kubernetes watches ──┼─> backend event bus ──┴─> authenticated WebSocket
Portainer commits ───┤
Edge and job events ─┘
```

The transport protocol is versioned. A connection is registered before the server sends `ready`; the client then refreshes active snapshots. Ordered invalidation IDs suppress duplicates. A slow connection is closed instead of silently losing invalidations, and reconnecting performs another snapshot synchronization.

The current global invalidation is a compatibility stage. It must be replaced with authorization-filtered resource scopes before frontend polling is removed at scale.

## Delivery sequence

### Phase 0: ratchets and baselines

- Run `pnpm check:frontend-modernization` in CI.
- Do not add Angular controllers, templates, Angular routes, bridge adapters, or frontend polling.
- Lower each ratchet limit in the same pull request that removes debt.
- Record shipped JavaScript, cold load, warm navigation, and memory baselines.

### Phase 1: reliable realtime transport

- Emit notifications only after successful mutations.
- Version messages and assign monotonically increasing connection-local event IDs.
- Register subscriptions before the initial synchronization barrier.
- Reconnect with capped exponential backoff and jitter.
- Add connection, disconnect, lag, overflow, and resynchronization metrics.

### Phase 2: typed and scoped events

Define an event envelope containing:

- protocol version and event ID;
- resource domain, kind, identifier, and environment ID where applicable;
- action (`created`, `updated`, `deleted`, `status`, or `resync`);
- resource revision and occurrence time;
- an authorization scope, without resource bodies or secret values.

Map those events to React Query key prefixes. Patch a cached entity only when the event contains a complete, non-sensitive representation; otherwise invalidate the smallest safe query prefix.

### Phase 3: authoritative event sources

Implement in this order:

1. Portainer datastore commits and background jobs.
2. Docker Events for containers, services, images, networks, volumes, secrets, configs, tasks, and swarm state.
3. Kubernetes watches with `resourceVersion`, relisting after expired watches, and namespace authorization.
4. Edge connectivity, stack deployment, job-result, and agent status events.
5. Dedicated metrics streams. Logs already use dedicated WebSockets.

Only remove a `refetchInterval` or `$interval` after its authoritative event source and reconnect/resync tests exist.

### Phase 4: React-owned vertical slices

Migrate complete routes, including data access, authorization, forms, error handling, and tests. Keep `@uirouter/react` initially so route URLs and browser history do not change during the framework migration.

Suggested order:

1. Small leaf routes and the remaining Agent and Edge Angular components.
2. Account, tags, users, registry, and settings routes.
3. Docker resource creation/detail routes.
4. Kubernetes configuration, deployment, volume, and log routes.
5. Authentication, initialization, main layout, and the application bootstrap.

Convert Angular services to typed TypeScript API modules before removing their final callers.

### Phase 5: removal

- Replace `ng-app` with a React root.
- Remove `react2angular`, `withUIRouter`, and the hybrid-router module.
- Remove Angular modules, services, controllers, templates, loaders, types, mocks, and dependencies.
- Remove all production data-refresh intervals and auto-refresh controls.
- Upgrade React independently after the Angular runtime is gone.

## Acceptance criteria

### React-only frontend

- No AngularJS packages or hybrid-router package in `package.json`.
- No Angular bootstrap, controllers, services, directives, templates, `$scope`, `$q`, `$resource`, or `$interval`.
- Every route is React-owned and can be lazy-loaded.
- Authentication, authorization, deep links, browser navigation, and Docker Extension behavior pass end-to-end tests.

### Poll-free live data

- Every live screen performs an initial HTTP fetch.
- Changes made through Portainer or directly through supported Docker/Kubernetes APIs appear within the defined delivery SLO.
- Disconnects display `reconnecting` and then either resume or perform a full resynchronization.
- Permission changes immediately stop unauthorized event delivery.
- No resource identifiers, names, configuration bodies, credentials, or secret values leak through unauthorized events.
- Production `refetchInterval` and data-refreshing `$interval`/`setInterval` usage is zero.

## Required test matrix

- Create, update, delete, and status transitions for each resource family.
- An event arriving during the initial fetch.
- Duplicate and out-of-order messages.
- Slow consumers and event bursts.
- Server restart and client reconnect.
- Authentication expiry, logout, user switch, and permission removal.
- Direct Docker and Kubernetes mutations outside Portainer.
- Multiple browser tabs and, where supported, multiple Portainer server instances.
