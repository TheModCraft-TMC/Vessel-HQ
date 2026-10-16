# Vessel HQ native extension system

Status: experimental implementation started October 15, 2026; full platform delivery is not scheduled.

This design replaces the October 12 companion-application-first proposal. The selected direction is administrator-installed, native compiled UI extensions with separately isolated backend services, explicit grants, and a dedicated gRPC integration API. Implementation was authorized October 15. The current slice provides `.vesselhq` ZIP upload/storage with native UI and optional Linux Go/Rust-compatible executable payloads, persistent approval/revocation, native candidate preview, protected build tooling, mTLS registration diagnostics, scoped environment metadata and Docker stack topology reads, and administrator-only persistent extension notes with separate read/write grants. Approved package sets can share one isolated development build. Infrastructure mutations, managed backend startup, automated background builds, production activation, and rollback remain future work. See [development instructions and current limitations](../native-extensions.md). No production deployment is included.

## Product direction and trust model

The current [Go SDK](../extension-sdk-workspace.md) is a standalone module used by the
operator example and host wire contract. It handles TLS 1.3, package identity
verification, registration/environment calls, separately granted extension-owned
note reads/writes, bounded deadlines and cancellation. A shared private Unix
gateway permits service containers with no published ports; a real no-network
container write-back has been verified. It does not issue production identities,
start managed services, publish itself, or provide infrastructure mutation grants.
The stack action now expands inline above Stack details and supports scoped
Traefik-label routing and bounded live Docker byte-counter sampling.
SDK publication, general reverse service routing, managed credential rotation and
additional approved RPC families remain future milestones.

Extensions should feel like Vessel features: native React pages, resource tabs, dashboard widgets, settings, and actions using Vessel components and tokens. Iframes are not the selected UI model. Extensions contribute through versioned extension points rather than patching arbitrary application files.

Blueprint for Pterodactyl is inspiration for administrator-managed installation and native integration, not a package compatibility target. Its [installation workflow](https://blueprint.zip/guides/admin/extensions) and [lifecycle scripts](https://blueprint.zip/docs/concepts/scripts) illustrate the trust placed in installed packages. Vessel's proposal does not permit extension scripts to patch the core or execute with production host privileges. Portainer add-on package compatibility is also not assumed.

Only administrators may install, update, enable, disable, remove, or grant capabilities to extensions. They must review package identity, version, provenance, requested capabilities, and the native frontend trust warning. Installation requires trusting the extension publisher and code, including dependencies. Signatures establish origin and integrity; they do not establish safe behavior.

Native extension JavaScript executes in the console's browser context. It can potentially inspect or alter the DOM and attempt requests with the current user's browser authority, even if protected source files are unchanged. A React wrapper, error boundary, CSP, import restriction, checksum, or successful build does not isolate malicious same-context JavaScript. Backend gRPC grants are enforced boundaries for extension service identities; they cannot guarantee that native frontend code only acts through those identities. This limitation must be visible at approval, not buried in developer documentation.

## Proposed architecture and ownership

| Component | Responsibility |
| --- | --- |
| Protected console host | Own navigation, fixed route adapters, extension slots, loading/error handling, and active build identity |
| Extension administration | Package review, capability approval, lifecycle state, build status, audit history, and recovery |
| Isolated builder | Produce a candidate console from a verified Vessel baseline and an immutable approved extension set |
| Extension gateway | Authenticate identities and delegated user context; authorize narrow gRPC operations; enforce limits and revocation |
| Extension service | Run separately with its own identity and storage; communicate with Vessel services exclusively through the extension gRPC API |
| Release manager | Serialize changes, validate candidates, switch active artifacts, and retain a compatible rollback target |

Proposed ownership follows the [domain/provider architecture](frontend-domain-provider-architecture.md): host contracts and composition in `web-src/core`, administration in `web-src/domains/extensions`, transport/deployment adapters behind provider public APIs, reusable presentation in `web-src/ui`, and authorization, persistence, gateway, and lifecycle coordination in `backend-src`. Create these owners only when implementation is authorized. Do not add boundary exceptions to accommodate extension imports.

Use a core-owned route such as `/extensions/<id>/*` and explicit slot registrations. The trusted assembler generates registration data in a designated generated area; extension packages cannot replace Next.js route files or introduce arbitrary server actions, middleware, or server-side modules. New slots require a core SDK change. Do not load Go shared libraries into the API process.

The deprecated Portainer `Extension` model/datastore service is not an existing runtime. Assess its meaning and migration requirements before selecting persistence.

## Package and manifest contract

Each immutable package should declare:

- Stable publisher/extension ID, version, package digest, source/provenance metadata, and license.
- Compatible Vessel extension SDK and gRPC API versions, separately from the upstream API/datastore baseline and Vessel release identity.
- Native UI entry points and requested slots, namespaced routes/styles, and permitted SDK imports.
- Optional service image pinned by digest, protocol versions, health contract, and resource requirements.
- Requested capabilities, whether required or optional, justification, and configurable resource scopes.
- Settings schema, secret references, owned data schema version, and migration/recovery requirements.

A package cannot grant itself permissions, replace publisher identity during an update, or redefine its digest after review. Bind approval to the exact package digest, manifest, dependency lock, and capability set. Dependency changes require review. Pin dependencies and use a core-controlled resolver; extension packages cannot overwrite the root lockfile or substitute core packages. Reject unsafe archive paths, symlinks escaping staging, duplicate IDs, and attempts to write outside the extension's namespace.

An illustrative request might ask for `volumes.metadata.read` on an environment and `events.subscribe` for volume events. These are proposed capability names, not existing API methods. Reading volume contents, exporting data, executing commands, or changing workloads would require distinct capabilities.

## Protected core and integrity checks

The protected set includes the permission/approval UI and its dependencies, authentication/session handling, routing and host composition, API credential handling, grant persistence/enforcement, build configuration/tooling, package resolution, and the integrity verifier itself. Protecting only the permission route file is insufficient.

1. Start from a verified Vessel release/source artifact with a trusted integrity manifest supplied by the core release process. Never generate the baseline from extension-modified files.
2. Give the builder read-only access to baseline inputs, a writable extension staging directory, and a writable output directory. No write access to the running installation.
3. Reject a package that targets protected paths before invoking compilation. Verify hashes and the complete protected path set, including additions, deletions, file types, and symlink targets.
4. Recheck protected inputs before accepting output. The verifier and activation controller run outside extension-controlled build execution.
5. Record the baseline, package set, toolchain, dependency lock, approval revision, checks, and candidate artifact digest. Activate only the exact verified artifact.

Generated registration files are explicitly owned by the trusted assembler and validated against approved slot declarations. They are not an unrestricted exception to protected files. Compare source inputs against the baseline; whole compiled bundle hashes naturally change when approved extension UI is included.

A core upgrade provides a new trusted manifest and requires compatibility validation of the entire enabled extension set. A changed protected file rejects the extension candidate; administrators cannot bypass this by approving an extra extension capability. These checks prevent unauthorized source changes, not runtime DOM manipulation by trusted frontend code.

## gRPC and capability enforcement

Extension backend services receive no Vessel database access, production filesystem mounts, Docker/Podman sockets, Kubernetes credentials, Vault tokens, or user session tokens. Use separate unprivileged runtime identities, bounded CPU/memory/storage, and network restrictions so services cannot bypass the gateway. Any external network destinations or additional runtime resources require separately reviewed policy; they are not implicitly granted by installation. Managed deployment must enforce the selected policy; manually deployed services require an explicit operator configuration check.

Expose versioned protobuf services for narrow operations. Do not expose an arbitrary HTTP proxy, SQL access, shell execution, or an unrestricted Docker/Kubernetes API tunnel. Authenticate each service with its own identity using mTLS and short-lived credentials. Apply server-side checks on every unary call and throughout streams/jobs; client-side SDK restrictions are only usability aids. See gRPC's [authentication](https://grpc.io/docs/guides/auth/) and [interceptor](https://grpc.io/docs/guides/interceptors/) guidance.

The supported frontend path is native UI → core-owned authenticated host endpoint → authorized gRPC service call. The host derives the extension identity from a validated registration and the user from the authenticated session; it does not accept a caller-selected user as authority. Extension services access Vessel through the dedicated gRPC gateway. Browser transport to the host can use the application's existing transport; no extension credentials are sent to the browser. This contract is not a promise that trusted native JS cannot attempt other existing browser APIs.

For user-triggered operations, effective access is the intersection of the approved extension grant, the current user's effective permissions, and the environment/resource scope. Bind delegation to extension identity, user, audience, resource scope, action, and expiry. Resolve authorization using current core policy rather than a separate inconsistent RBAC engine. Background jobs require separately approved service grants, never borrowed browser sessions.

All capabilities default to denied. Installation declares requests; approval records grants. Required permissions left unapproved block activation; optional capabilities stay unavailable. Additional capabilities or wider scopes in an update require fresh approval. Removing a requested capability removes its grant. Extension service identities cannot manage installations, change grants, approve themselves, or authorize other extensions.

Revocation blocks new operations immediately and closes affected streams. Workers must reauthorize before queued work or subsequent privileged steps. Specify cancellation and recovery per operation: already completed external side effects cannot be undone by revoking a grant. Bound message sizes, stream lifetimes, concurrency, deadlines, and subscription scopes. Realtime delivery must use authorized invalidation and bounded streams, not routine polling.

Settings/data are namespaced per extension. Keep secrets server-side, redact them from responses/logs, and prefer mediated operations over revealing secret values. Audit installation, approval, denial, privileged operations, revocation, builds, activation, and rollback with extension identity, initiating user/service grant, scope, outcome, and artifact identity.

## Background build and activation lifecycle

Proposed flow: submitted → reviewed/approved → queued → building → validating → ready → active. Rejected/failed candidates never replace the active version. Disabling and removal are separately audited operations.

1. Freeze the proposed enabled package set and approval revision. Serialize builds per installation and reject stale candidates if approvals, package set, core version, or configuration change.
2. Run the integrity gate, then build in a disposable environment without production credentials, host sockets, or writable production volumes. Restrict dependency retrieval to approved pinned artifacts; reject extension install hooks/custom build scripts in the initial version.
3. Run architecture guards, typecheck, tests, lint, production build/packaging, and candidate browser smoke checks. Exercise core login, navigation, permission management, extension routes, and one permitted/denied operation. Test combinations of enabled extensions, not just each package alone.
4. Start the candidate separately and verify health and asset availability. Retain the active build while validation runs. Error boundaries contain ordinary render failures; they cannot guarantee recovery from arbitrary native JS behavior such as blocking the main thread.
5. Atomically select the validated console artifact and matching extension service versions. Retain old assets for existing browser sessions and require reload when compatibility requires it. Define coordination with caches, multiple replicas, active sessions, and in-flight requests before production use.
6. On activation/health failure, restore the previous compatible artifact/service set. Rollback restores code, not revoked grants or administrator permissions. Re-evaluate current grants before activating any old package.

Failed builds expose sanitized diagnostics and leave current grants/version serving users unchanged, except deliberate revocations which take effect immediately. Build approval is not permission to perform extension data migrations against production. Use backwards-compatible migrations or a separately approved recovery procedure; do not claim rollback can undo arbitrary data changes.

An emergency disable endpoint/CLI must work without rendering extension JS. It revokes backend grants, prevents new host dispatches, and selects a known-good console without the extension. Already open tabs may retain frontend code until reload; backend revocation still applies. Removing an extension from the compiled console follows the build gate; recovery must not depend solely on a successful new build. Separate uninstall from deletion of owned data.

## Proposed delivery sequence and acceptance

### Phase 0: contracts and implementation planning

Define the manifest schema, protobuf API, capability catalog, protected-file policy, approval UX, runtime deployment requirements, and artifact switching mechanism. Select one minimal read-only reference extension. Complete a threat model reflecting trusted native frontend code. Estimate effort after a build/activation feasibility spike; the previous companion-app estimates do not describe this architecture.

### Phase 1: native read-only reference extension

Build one resource tab with native components and one narrowly scoped metadata capability plus an optional event subscription. Initially deploy its backend manually. Include administrator approval, protected-input verification, candidate builds, activation, disable, and recovery.

Acceptance evidence must show:

- Non-administrators cannot install, change grants, activate candidates, or use lifecycle endpoints directly.
- Denied, cross-environment, cross-user, forged delegation, expired credential, and extension-identity spoofing calls fail server-side.
- Attempts to alter protected inputs, the baseline/verifier, dependencies, or generated registrations outside declared slots reject the candidate.
- Build/check/health failures and stale approvals leave the active artifact untouched; a valid candidate switches successfully.
- Required/optional grants, updated permission requests, revocation during streams/jobs, and rollback obey current policy.
- Extension crashes have bounded backend impact; ordinary UI render errors show a fallback. Recovery works when extension UI cannot render.
- No build secrets, service credentials, or sensitive settings appear in browser bundles or diagnostics.
- Native UI matches Vessel themes, navigation, accessibility, and TanStack Query/realtime ownership.

### Phase 2: lifecycle and controlled mutations

Introduce narrowly scoped mutation capabilities, quotas, confirmation flows for destructive operations, data migration/recovery contracts, and a Compose deployment adapter. Support Docker installations first without excluding Podman, Swarm, Kubernetes, or Azure ACI workflows. Add Helm support after the service lifecycle contract is proven; not every runtime must support every extension capability.

### Phase 3: ecosystem tooling

Expand versioned UI slots, SDK templates, compatibility fixtures, provenance verification, and a reviewed catalog. Automated distribution and updates must preserve digest-bound approval, protected builds, and permission review. No automatic grant expansion.

## Open implementation decisions

- Reference extension, exact capabilities, first supported slots, and permitted frontend dependency surface.
- Builder distribution/resource requirements for small Docker installations; remote building requires a separate trust and credential design.
- Artifact serving/switching mechanism compatible with Next.js standalone output and the existing deployment model.
- Service identity bootstrap/rotation, delegated request format, and protobuf compatibility window.
- Enforcement and verification of service egress restrictions across supported deployment adapters.
- Multi-replica activation, browser asset retention, rollback retention, and core upgrade coordination.
- Persistence schema, migration from any existing extension records, data backup, and uninstall retention.
- SDK maintenance, package review/signing policy, and operation-specific revocation/cancellation behavior.

See the [roadmap](vessel-hq-roadmap.md) for remaining work and the [verification guidance](../themodcraft/verification.md) for implementation checks. The delivery phases below describe target acceptance, not completed platform verification; current results belong in the [handoff](migration-change-summary.md).
