# Realtime state architecture

Status: accepted future direction; scoped event routing and telemetry stores are not implemented yet.

Last updated: September 21, 2026.

Vessel HQ treats server state as an event-driven live cache: an authoritative REST snapshot populates TanStack Query, authenticated WebSocket events keep that snapshot current, and reconnects force a safe resynchronization. Redux and RTK Query are not planned because they would create a second server-state cache without solving event frequency or render-pressure problems.

## Current baseline

- TanStack Query owns REST-backed server state, cache lifetime, mutation state, and invalidation.
- A singleton authenticated WebSocket synchronizer starts outside the React component tree after authorization succeeds.
- Version 1 events contain only `ready` or `invalidate`, with a monotonic event ID.
- `ready` is a resynchronization barrier: the server registers the subscriber before sending it, then the client refetches active queries. This closes the fetch-before-subscribe race.
- Duplicate and out-of-order events are ignored; reconnects use bounded exponential backoff with jitter.
- Mutation events intentionally expose no resource identifiers and therefore invalidate every active query.
- The server sends a snapshot invalidation every 15 seconds to cover Docker, Kubernetes, or other external changes until native engine event fan-out exists.
- Logs use a dedicated authenticated WebSocket, a 10,000-line bound, and 100 ms publication batching. Terminal sessions remain imperative streams rather than query-cache state.

This baseline is safe and simple, but global invalidation becomes wasteful as the number of active queries and connected environments grows.

## Target ownership

| State class                                                                              | Owner                                              | Update strategy                                                            |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| Containers, stacks, images, networks, environments, users, and settings                  | TanStack Query                                     | REST snapshot followed by scoped invalidation or authoritative cache patch |
| WebSocket connection lifecycle, authentication, sequencing, reconnect, and event routing | `app/core/realtime`                                | One connection coordinator outside domain components                       |
| Query keys and event-to-cache mapping                                                    | Owning domain query modules                        | Invalidate the smallest authorized list/detail scope                       |
| Logs and terminal data                                                                   | Dedicated stream adapters                          | Bounded buffers and imperative or throttled publication                    |
| CPU, memory, network, and I/O samples                                                    | Domain-local external store or bounded ring buffer | Publish at an explicit frame/time budget rather than per packet            |
| Local interface state                                                                    | Component state or Zustand                         | Fine-grained subscriptions; never a duplicate server cache                 |

Zustand is appropriate only when multiple components genuinely share local or telemetry state. A ref plus `useSyncExternalStore` is preferred for a single bounded stream. The choice of store does not replace batching, backpressure, or narrow subscriptions.

## Planned event protocol

A future protocol may add authorized resource scope:

```ts
type RealtimeCacheEvent = {
  version: 2;
  id: number;
  environmentId: number;
  resource: 'container' | 'stack' | 'image' | 'network' | 'environment';
  resourceId?: string;
  action: 'created' | 'updated' | 'removed';
};
```

The exact schema remains subject to a security review. Resource type, identifier, name, environment, and event timing can all reveal information. The server must filter the stream to the authenticated user's current authorization scope before transmission. Sending a broad stream and filtering in the browser is prohibited.

## Client event routing

1. Validate protocol version, sequence, resource type, action, and identifiers.
2. Reject duplicate or out-of-order event IDs.
3. Map the event through a domain-owned registry to typed query keys.
4. Coalesce duplicate keys in a short bounded window, initially 50–100 ms.
5. Invalidate the smallest affected list and detail scopes.
6. Use `setQueryData` only when the event is an authoritative complete patch for the cached shape. Partial or ambiguous messages trigger invalidation instead.
7. Preserve the `ready` barrier and refetch active queries after reconnect, sequence gaps, authorization changes, or buffer overflow.

Domains must not open independent lifecycle sockets from React components. They register cache-event mappings with the core coordinator and own the resulting query-key behavior. Provider event adapters normalize Docker, Podman, Kubernetes, cloud, or edge-native events before those mappings consume them.

## High-frequency stream rules

- Do not dispatch every log line, terminal frame, or metric sample through Redux, Zustand, TanStack Query, or React component state.
- Bound memory by line count, byte count, sample count, and/or time window.
- Decode and append outside React, then publish on an explicit cadence. Use `requestAnimationFrame` only for visuals that benefit from frame alignment; otherwise prefer a slower 100–250 ms telemetry cadence.
- Subscribe components to the narrowest resource and selector possible.
- Pause expensive publication when a stream is hidden, while retaining enough connection state to recover safely.
- Define overflow behavior. Dropped lifecycle events require a REST resync; dropped telemetry samples may be acceptable when clearly bounded.
- Keep logs, terminal traffic, metrics, and cache invalidations on distinct logical adapters so one noisy stream cannot starve control-plane updates.

## Failure and reconnect behavior

- Exponential reconnect backoff remains capped and jittered.
- A reconnect, sequence gap, protocol mismatch, authorization change, or slow-consumer disconnect causes an active-query resynchronization.
- The UI exposes connecting, live, reconnecting, stale, and offline states without discarding the last safe snapshot.
- Logout closes sockets, clears timers and sequence state, and prevents reconnection.
- Server-side subscriber buffers stay bounded. A slow consumer is disconnected rather than silently missing lifecycle events.

## Delivery phases

1. Move query-client, routing, and realtime coordination into `app/core` without behavioral changes.
2. Add observable connection state and tests for login, logout, reconnect, sequence gaps, and resynchronization.
3. Design and threat-model protocol version 2, including per-user and per-environment authorization filtering.
4. Introduce a typed, batched event-to-query-key registry with Containers as the first consumer.
5. Add native Docker and Kubernetes lifecycle event fan-out through their infrastructure providers, retaining periodic reconciliation as a safety net.
6. Move container statistics to a bounded telemetry adapter and measure render frequency, memory, and dropped samples.
7. Apply the proven pattern to stacks, images, networks, environments, and Kubernetes resources.

## Acceptance criteria

- No second global server-state cache or Redux dependency is introduced.
- A container mutation invalidates only the authorized affected list/detail scopes under protocol version 2.
- Bursts coalesce into bounded cache work instead of causing one refetch or render per event.
- Reconnect and overflow cannot leave the visible cache silently stale.
- Hidden or background telemetry has a bounded CPU, memory, and render cost.
- Logs, terminals, and charts remain responsive during lifecycle-event bursts.
- Security tests prove that event metadata does not cross environment, team, endpoint, or resource-control boundaries.
- Performance tests record event rate, cache operations, HTTP refetches, render count, memory growth, and recovery time.
