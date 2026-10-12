# Vessel HQ add-on and plugin system

Status: future proposal, not implemented or scheduled. Recorded October 12, 2026.

## Goal and reference

Extend Vessel HQ without building every integration into its core. Start with trusted companion applications with their own UI/backend, then introduce explicit, versioned extension points where needed. Docker-based installations should remain first-class alongside Kubernetes.

Portainer's add-on pattern uses a catalog, Helm lifecycle, reverse-proxy gateway, settings API, and shared access control for companion applications in its local Kubernetes cluster. This is a product reference, not a promise of compatibility with Portainer packages or a general-purpose plugin SDK. See [Portainer's add-on architecture](https://learn.portainer.io/module-11) and [2.45 release announcement](https://portainer.io/blog/portainer-2-45-lts-release).

## Scope and indicative effort

Estimates assume one experienced developer familiar with the repository, a small initial scope, and trusted add-ons. They are discovery estimates, not delivery commitments.

| Approach | Capability | Effort |
| --- | --- | --- |
| Built-in optional modules | Bundled features; adding code requires rebuilding | 1–2 weeks |
| Companion add-ons | Separate applications, navigation, settings, controlled API access | 4–8 weeks for a usable first version |
| Deep runtime plugins | Resource tabs/actions, dashboard widgets, backend integrations without rebuilding | 3–6 months for an initial platform |

Automatic deployment, multiple target types, public third-party distribution, and broad compatibility guarantees increase the scope.

## First-version architecture

- Manifest: stable ID, version, compatible Vessel API versions, UI entry, settings schema, requested capabilities.
- Registry/manager: registration, enabled state, configuration, health, and removal; initially administrator-approved, manually deployed services.
- Console host: sidebar integration and a dynamic route such as `/extensions/<id>/*`. Installing an arbitrary React package does not create Next.js App Router routes.
- Go gateway: approved service destinations, authentication, scoped authorization, revocation, audit records, and health checks.
- Add-on service: separately deployed UI/backend with its own state, communicating through defined contracts.
- Settings: plugin-isolated storage; secrets remain on the server and are redacted from logs and UI responses.

Proposed ownership: extension host and contracts in `web-src/core`, administration workflows in `web-src/domains/extensions`, deployment/transport adapters behind provider public APIs, and authorization/persistence/gateway in the Go API. The existing deprecated Portainer `Extension` model and datastore service are not an existing plugin runtime; assess storage migration before reusing them.

## Authorization and browser isolation

Plugin grants intersect with the user's current permissions and environment/resource scope. Enforce them server-side on every operation, including direct requests; hiding navigation is insufficient. Disabling a plugin revokes its access. Unattended jobs need separately approved, scoped machine grants rather than borrowed user sessions.

A manifest or iframe alone is not a security boundary. A same-origin proxied UI can inherit considerable browser trust. Choose trusted same-origin applications or isolated origins/sandboxed frames with a narrow messaging API before implementing UI hosting. Review cookies, CSP, CSRF, redirects, WebSockets, and allowed proxy destinations. Do not pass a user's full session token to an add-on.

## Delivery sequence

### Phase 1: companion applications

Register one manually deployed reference service; configure and enable/disable it; expose its UI; enforce scoped access; report health; revoke access on removal. Define API version negotiation and failure behavior. A backup integration is a possible reference, not a selected implementation.

Acceptance: an administrator can register the add-on, an allowed user can open it, denied users cannot access it directly, and add-on failure does not prevent the console from loading. Validate scope enforcement, revocation, secret isolation, proxy restrictions, and audit records.

### Phase 2: managed deployment

Add Compose and Helm adapters for install, upgrade, restart, uninstall, and recovery. Pin versions/digests, define ownership of deployed resources, and separate uninstall from deleting data. Add a catalog after the lifecycle contract works.

### Phase 3: explicit UI slots

Introduce versioned dashboard widgets, resource detail tabs, and resource actions. For example, a backup add-on could contribute an action on volume details. Define context, permission checks, loading/error isolation, and compatibility before exposing each slot.

### Phase 4: wider ecosystem

Evaluate signing/provenance, SDK tooling, distribution, compatibility testing, and third-party trust levels. Keep backend integrations behind service APIs rather than loading arbitrary Go shared libraries into the core server. Consider frontend runtime loading only when isolated applications and defined slots cannot meet demonstrated needs.

## Open decisions and prerequisites

- Reference add-on and its minimum required capabilities.
- Browser isolation and authentication exchange.
- Supported Compose/Helm and runtime versions.
- API compatibility window and version negotiation.
- Backup, upgrade migrations, rollback, and data retention.
- Machine grant approval and revocation lifecycle.

Finish the current frontend migration before implementation. Use the [roadmap](vessel-hq-roadmap.md) and [domain/provider architecture](frontend-domain-provider-architecture.md) when creating implementation tasks.
