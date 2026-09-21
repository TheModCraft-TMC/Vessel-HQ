# Vessel HQ customizations

This directory is the maintenance handoff for behavior added by this fork. It explains the design, security boundaries, release identity, verification, and deployment process without requiring readers to reconstruct the changes from Git history.

## Contents

- [Feature planning backlog](../planning/README.md): one-month discovery backlog, scoring rubric, and planning-ready gate for possible future fork features.
- [Vessel HQ product and architecture roadmap](../planning/vessel-hq-roadmap.md): completed migration baseline, repository and image policy, React domain architecture, deeper rebranding, component adoption, and homelab-first responsive plans.
- [Frontend module architecture](../planning/frontend-architecture.md): enforced boundaries and the incremental domain-slice migration procedure.
- [Frontend domain and provider architecture](../planning/frontend-domain-provider-architecture.md): canonical `domains`, external `providers`, shared `ui`, and route-level `views` terminology.
- [Frontend domain schema](../planning/frontend-domain-schema.md): superseded feature-era checkpoint and legacy-folder migration history.
- [UI component inventory](../planning/ui-component-inventory.md): current primitives, styling foundations, adoption candidates, and package-selection gates.
- [Containers vertical-slice migration](../planning/containers-vertical-slice.md): first domain move, route ownership, dependency ratchet, and cleanup order.
- [Azure vertical-slice migration](../planning/azure-vertical-slice.md): consolidated Azure ownership, GoLand-assisted route refactor, and cleanup ratchet.
- [Realtime state architecture](../planning/realtime-state-architecture.md): accepted future cache invalidation, WebSocket, telemetry, security, and backpressure design.
- [React and realtime frontend modernization](../planning/frontend-modernization.md): implemented React-only baseline and remaining realtime hardening requirements.
- [Recent features](../recent-features/README.md): table of work added, restored, or consolidated during the last four weeks.
- [Overview response cache](overview-cache.md): stale-while-revalidate caching for Docker, Podman, and Kubernetes overview views.
- [Custom versioning](custom-versioning.md): footer version, Docker Hub update checks, and the boundary between the fork release and the upstream API/database version.
- [Release and deployment](release-and-deployment.md): AMD64/ARM64 image production, Node 4 deployment, and rollback.
- [Verification](verification.md): focused tests and release checks.
- [Read-only stack sharing](../maintainer-patches/stack-read-only-access.md): owner/editor versus viewer permissions for selected stacks and agentic accounts.
- [Roles, registries, and realtime UI](../maintainer-patches/roles-registry-realtime.md): custom-role lifecycle, GHCR browsing, and event-driven client cache synchronization.
- [Live logs and node metrics](../maintainer-patches/live-logs-node-metrics.md): authenticated Docker log streaming and session-scoped Kubernetes node chart history.

The broader patch catalog remains in [the maintainer patch guide](../maintainer-patches/README.md).

## Design principles

1. Cache only collection data used by overview views. Inspect/configuration views and mutations always reach the runtime.
2. Cache data before Portainer's Docker authorization filter, then filter an independent response copy for each user.
3. Never share Kubernetes results across users because Kubernetes service-account RBAC is applied upstream.
4. Keep the upstream API/database compatibility version separate from this fork's release version.
5. Publish immutable multi-architecture version tags before moving `latest`.
6. Treat stack viewer grants as configuration visibility only; never inherit them as Docker-resource mutation access or expose redeploy webhook tokens.
7. Use mutation events only as cache-invalidating signals; never put resource identifiers or user data in the WebSocket payload.
8. Bound realtime browser buffers, close streams with their views, and validate cached session data before rendering it.
