# Native extension development

Status: experimental implementation, verified October 16, 2026. This branch adds the first
whole-package upload, approval, native preview, protected candidate-build tooling,
and scoped gRPC environment and Docker stack topology reads. It does not automatically start
uploaded backend executables or switch the production console.

## Normal development console (8999)

The prepared development instance now installs the approved example set into the
normal checkout used by `http://localhost:8999`. Its existing backend/datastore
remain in use. Open
`http://localhost:8999/1/docker/stacks/extension-network-demo?regular=true&type=2&id=1`.
Each extension owns its card between **Stack details** and **Containers**.
**Network overview** expands its inline drawer with Networks, Traffic flow and
Traefik config views. Traffic flow is a branching React Flow device map with
selectable devices and live aggregate workload RX/TX. Both canvases track the
console’s dark, light and high-contrast themes. It requires a managed Compose/Swarm stack, matching compiled
package and explicit environment/stack grants; an external/unmanaged stack does
not acquire access merely because its name matches Docker labels.

Port 8999 originally had an empty generated registry and a different backend from
the isolated runtime on 19000. Upload/approval in one instance does not install or
approve the extension in another. The normal instance now uses its own approved
registrations and a complete isolated build before generated source selection.
The demo stack has an internal HTTP service and request generator, without any
published ports. It is a test fixture, not an installed Traefik proxy.

## Earlier standalone reference runtime (19000)

The October 16 local build is assembled at `dist/native-extension-demo/` on the
development machine. Build output is ignored by Git. It includes the macOS ARM64
backend, Node 24.21.0 runtime, standalone console with Network Overview and
Persistent Notes compiled in, and three `.vesselhq` packages. From the repository
root, run `./dist/native-extension-demo/run-demo.sh` and open
`http://127.0.0.1:19000`. Sign in as `admin`; the launcher prints the private
password-file path. Its default state directory is
`/tmp/vessel-extension-smoke`, outside the distributable. Do not start another copy
while those ports are in use. Ctrl-C stops the supervised frontend and backend.

The prepared datastore contains a Docker environment and test stack scoped to
IDs 1 and 1. Open
`/1/docker/stacks/vessel-extension-smoke?regular=true&type=2&id=1` for Network
overview, or `/extensions/persistent-notes` for write-back. Keep Docker Desktop
running for topology reads. Setting `VESSEL_EXTENSION_DEMO_STATE` to a new private
directory creates a fresh instance; upload and explicitly approve the included
packages there. A fresh instance also needs its own Docker environment and stack.

`build-receipt.json`, `verification/` and `SHA256SUMS` accompany the artifact.
The receipt binds the approved packages used during compilation; subsequent
reapproval is still checked live. The optional Go metadata client remains a
manual mTLS service example. This local runtime does not implement production
activation or managed service startup. See the
[fresh verification record](planning/migration-change-summary.md#fresh-final-verification--october-16-2026).

## What works

- Administrator-only `/extensions` management: upload a `.vesselhq` package (or
  submit a manifest through Advanced), review individual
  capabilities and environment scopes, acknowledge native UI trust, approve the
  exact revision, disable/revoke, and remove a registration.
- Registrations and grants persist in a separate `native_extensions` datastore
  bucket. Lifecycle changes and their audit entries commit in one transaction.
  Updating a manifest clears approval; stale revision approval returns a conflict.
- Candidate consoles can compile native UI into a core-owned preview route at
  `/extensions/<manifest-id>`. The host checks current administrator access,
  approved native UI trust/grant, and exact source package digest before lazy
  loading. Failed approval queries block loading. The baseline ships with no
  executable third-party registrations.
- A source integrity gate and isolated Docker validation CLI stage extension
  packages without changing the running checkout. See the
  [builder instructions](../scripts/native-extensions/README.md) and
  [simple plugin workspace](extension-sdk-workspace.md).
- Whole-package validation and immutable archive storage support native UI and
  optional Go/Rust-compatible Linux executable artifacts. Uploading clears old
  approvals and never executes code. Cards show uploaded/approval/backend state.
- An opt-in mTLS gRPC listener supports identity-bound `GetRegistration` and real
  `GetEnvironment` metadata reads (ID/name/type/status only). Reads require a
  separately approved unattended service grant for the selected environments.
  It exposes no connection URLs, credentials, engine sockets, mutations, or
  arbitrary proxies. Allowed, denied, and failed reads are audited.
- The native `docker.stack.detail.action` slot contributes an extension-specific card
  and inline drawer between managed Docker Compose/Swarm stack details and
  Containers/Services. Only an exact compiled
  package matching current approved slot metadata can load. User-triggered
  topology reads cross a private, genuine mTLS gRPC connection, intersecting
  explicit extension environment/stack grants with fresh current-user access.
  Network reads return stack workloads, attached network metadata, and their relationships;
  unrelated network members, IPs, raw labels, environment variables, and
  credentials are excluded. There is no routine polling.

## Whole-package format

`.vesselhq` is a standard ZIP with a root `manifest.json`. It may contain native
TypeScript/React/CSS under `ui/`, declared backend executables, or both:

```text
manifest.json
ui/index.tsx
backend/linux-amd64/extension
backend/linux-arm64/extension
```

Declare backend artifacts in the manifest:

```json
{
  "backend": {
    "type": "executable",
    "entrypoints": {
      "linux-amd64": "backend/linux-amd64/extension",
      "linux-arm64": "backend/linux-arm64/extension"
    }
  }
}
```

This is a descriptor fragment, not a complete manifest. Backend artifacts must
be ELF64 binaries matching their declared architecture; Go and Rust are suitable
languages, and gRPC/protobuf is the language-independent integration contract.
Package source digests cover backend bytes as well as UI. Archive digests bind
the exact retained ZIP bytes. No private keys, credentials, lifecycle scripts,
host commands, symlinks, or undeclared files belong in a package.

Limits are 64 MiB compressed, 256 MiB expanded, 128 MiB per entry, 512 entries,
path depth 16, and compression ratio at most 100. Validation rejects traversal,
duplicate paths, special files, executable frontend source, invalid manifest
fields/digests, and mismatched executable platforms. Archives are validated without
extraction and retained under the backend data directory's
`native-extensions/packages/<archive-sha256>.vesselhq`, separate from core files.
Uninstall removes registry metadata; archive garbage collection is future work.

Use the trusted packer and canonical digest instructions in the
[builder guide](../scripts/native-extensions/README.md). Backend executables are
excluded from the candidate frontend source tree. A managed backend supervisor
with isolation, identity provisioning, and resource/network limits is still
required before upload can become automatic service startup.

## Native UI trust

Installed native JavaScript is trusted code in the browser's console context.
Source checksums prevent protected input changes, but cannot stop DOM changes or
attempts to use the logged-in user's existing browser APIs. Approval explicitly
acknowledges that limitation. A preview/error boundary is not a security sandbox.
Disabling revokes backend grants and blocks subsequent preview loads; already
loaded JavaScript may remain in open tabs until a reload.

Extension services must never receive user sessions, infrastructure credentials,
host sockets, or database access. Current metadata reads use an explicit scoped
machine grant (`serviceReadEnabled`), checked on each request and again after
reading. They do not borrow a browser session. User-triggered runtime
operations intersect current user permissions. Approval of UI code is
separate from unattended reads and from managed service/UI activation.

## Local workflow

1. Run the normal development stack and open `/extensions` as an administrator.
2. Pack the reference package with the builder CLI, then upload the `.vesselhq`
   file. Upload stores validated content for review; it does not execute, start,
   or compile the package. Advanced manifest registration remains available.
3. Approve only the capabilities/scopes needed and acknowledge native UI trust.
4. Use a reviewed core baseline and the builder instructions to stage a separate
   candidate containing the approved package. Keep the baseline and candidate
   receipt digests outside the writable workspace.
5. Validate that candidate using a separately provisioned, digest-pinned builder
   image. A validated candidate is still not production-activatable: browser and
   health checks, approval-revision binding, artifact attestation, and serving/
   rollback integration remain pending.
6. On a separately run development candidate console, open the preview route.
   The backend must contain approval for the exact package. A missing compiled
   package or mismatched/revoked grant displays a blocked state.

The explicit development operator controller in the builder guide can verify an
uploaded archive, bind current approval, compile in an isolated Docker builder,
recheck approval and protected inputs, and replace only generated development
package modules after success. Failed validation leaves the prior modules in
place. This source switch relies on Next.js development recompilation and is
not a production artifact/health activation controller.

No automatic background build queue, catalog, production activation, managed service
deployment, automatic update, or rollback controller is exposed yet.
The candidate build command runs synchronously and can be executed by a future
background worker. Never mount production data or credentials into its builder.

## Management HTTP API

All paths are under `/api` and require an authenticated Vessel administrator;
these are core administration operations, not an alternate extension runtime API.
JSON uses camelCase. JSON requests reject unknown fields and bodies larger than
128 KiB. The package endpoint accepts one multipart `file` up to 64 MiB.

| Method and path | Body / behavior |
| --- | --- |
| `GET /native-extensions` | List registered manifests, revisions, state, and grants |
| `POST /native-extensions` | Manifest; matching manifest ID replaces metadata, increments revision, and revokes old grants |
| `POST /native-extensions/upload` | Multipart `.vesselhq` file; validate/store/register as pending with no grants |
| `GET /native-extensions/<numeric-id>/package` | Download the immutable uploaded archive after digest verification |
| `PUT /native-extensions/<numeric-id>/approval` | `{revision, trustedNativeUI, serviceReadEnabled, grants: [{capability, environmentIds, stackIds?}]}`; grants must be a subset of declared scopes |
| `POST /native-extensions/<numeric-id>/disable` | Clear grants and native UI trust, set disabled |
| `DELETE /native-extensions/<numeric-id>` | Remove registry metadata; does not delete external resources or extension data |

Current capabilities are `ui.native` (global, empty environment list) and
`environments.read`, `containers.read`, `stacks.read` (explicit positive environment
IDs). `environments.read` has a real metadata RPC; container/stack reads remain
reviewable declarations without runtime methods. Unknown capabilities are denied.
`stacks.network.read` and `stacks.traffic.read` additionally require explicit positive `stackIds` as well
as `environmentIds`, both declared and individually approved. It has no unattended
machine access. Supported UI slots are `extension.page` and
`docker.stack.detail.action`.
See the reference manifest for the optional `ui.entry`/`ui.slots` shape.

Authenticated users may request `GET /native-extensions/slots?environmentId=X&stackId=Y`
to discover minimal currently authorized stack contributions and
`POST /native-extensions/<numeric-id>/invoke` with
`{operation:"stacks.network.read",environmentId,stackId,revision,packageDigest}`
(or operation `stacks.traffic.read`) to invoke one. These
core browser bridges do not expose certificates, tokens, arbitrary methods or
engine proxies to packages. The host creates a short-lived signed delegated
lease bound to the exact extension, package, user, environment and stack. The
private gRPC server checks current user/resource access and extension grants
before and after the bounded Docker read, and fails closed if auditing fails.
The optional public gRPC listener cannot mint delegated user leases.

## Read-only gRPC service

The listener is off by default. Set all four server-only configuration variables
or startup fails closed:

- `VESSEL_EXTENSION_GRPC_ADDRESS`: dedicated listener, e.g. `127.0.0.1:19444`.
- `VESSEL_EXTENSION_GRPC_CERT`: server certificate PEM path.
- `VESSEL_EXTENSION_GRPC_KEY`: server private key PEM path.
- `VESSEL_EXTENSION_GRPC_CLIENT_CA`: dedicated extension-client CA PEM path.

TLS 1.3 and verified client certificates are mandatory. Client certificates need
one URI SAN in this exact form:

```text
spiffe://vessel.local/extensions/<manifest-id>/packages/<64 lowercase SHA256 hex>
```

The URI binds the service to a registered extension and source package digest.
CommonName and request metadata cannot override identity. Every RPC re-reads the
registry and checks current package approval. `GetEnvironment` additionally
requires explicit `serviceReadEnabled` and a granted `environments.read` scope.
Disabling or changing the package rejects subsequent calls even on an established
connection; audit failure blocks metadata delivery. `runtime_available` reports
whether unattended metadata reads are enabled/configured, not UI activation or
general infrastructure access. Do not share this CA with
ordinary users or unrelated workloads. Certificate issuance/rotation and service
provisioning are operator-managed in this slice.

The [Go SDK workspace](extension-sdk-workspace.md) is an independent module with a reusable mTLS
client, bounded calls, context cancellation and typed registration/environment
responses. It verifies the package identity on connection and preserves gRPC
status codes. It has no dependency on Vessel's backend module. The
[working operator example in the SDK project](extension-sdk-workspace.md)
generates private development mTLS credentials and uses the SDK for its calls.
The SDK also includes an independent environment-configured executable example.
Rust or other gRPC clients can use the same protobuf contract.

The shared [wire contract](https://github.com/TheModCraft-TMC/Vessel-HQ/blob/sdk/go/v0.1.0-beta.1/sdk/go/proto/v1/extension.proto) comes from the pinned published SDK module. Vessel has no local SDK replacement or duplicate generated Go wire types. SDK authoring and pinned protobuf generation now belong to the [independent SDK workspace](extension-sdk-workspace.md); host integration tests run with `GOWORK=off make test-extension-host`.

See the [design and remaining milestones](planning/plugin-system.md) and
[roadmap](planning/vessel-hq-roadmap.md) before expanding this experimental API.

## Persistent write-back example

The [persistent notes extension in the SDK project](extension-sdk-workspace.md)
adds an administrator page at `/extensions/persistent-notes`. It demonstrates
saving data back to Vessel, reading it after a reload, and detecting concurrent
edits. `storage.read` and `storage.write` are separate, explicitly approved global
permissions scoped by the host to the current extension registration. They accept
no environment scopes or infrastructure operations. Notes are shared administrator
text, not credentials or secrets. The host SDK exposes `storage.read()` and
`storage.write({text, version})` to approved page components.

`GET /api/native-extensions/<id>/storage?revision=<revision>&packageDigest=<digest>`
returns `{text, version}`. `PUT` to the same path takes
`{revision, packageDigest, text, version}` and returns the saved value and incremented
version. Both require current administrator access, current native UI approval and
the relevant storage grant. Stale approval/package/storage versions return 409;
revoked grants return 403. Text must be valid UTF-8 and at most 16 KiB. The backend
persists a write and its metadata-only audit entry atomically. Registration and
lifecycle responses omit saved notes, keeping reads behind the storage grant. Reupload preserves
notes while revoking old approvals; unregister removes them.

The development controller also accepts a complete set of packages through
`--packages-file`; it verifies each uploaded archive and approval before and after
one isolated build. See the builder guide for the descriptor format. Uploading or
approving remains distinct from executing native code. Production serving and
managed executable supervision remain outside this development workflow.

Stack topology HTTP invocations carry `revision` and `packageDigest` from the
host's approved slot record, alongside the operation, environment ID and stack ID.
Missing bindings return 400; a changed revision or source digest returns 409
before gRPC dispatch. The host copies the current scope into an immutable context
and supplies the binding itself. This prevents ordinary stale tabs from adopting
an updated package identity; it does not isolate malicious same-context native JS.
Approval queries bypass the normal view cache, recheck on every mount, and fail
closed on network errors, including while offline.

## Traffic and Traefik labels through Docker

`stacks.traffic.read` is separate from network-topology access and requires its
own explicit environment/stack scopes. Calls use the host's existing Docker
client or endpoint agent; extensions receive no Docker socket or Docker-native
inspection responses. The host projects only selected-stack Traefik router rules,
entrypoints, TLS flags, service ports/schemes, middleware references/types and a
small allowlist of safe middleware settings. Authentication values, custom header
values, sensitive header/query rules and unknown middleware values are redacted.
Static/file-provider Traefik configuration is not inferred from Docker labels.

The Traffic flow view presents configured entrypoint → router → service → workload
relationships. These are intended routes, not proof of actual request paths.
Live container RX/TX byte counters come from Docker one-shot stats, retaining full
counter precision and detecting resets before calculating KiB/s. They include
internal network traffic; Docker counters do not provide HTTP request counts,
router-specific traffic or latency. Those require a separately scoped Traefik
metrics/access-log source. No local Traefik proxy was available during verification.
Swarm label routing is supported; service/task counter sampling is explicitly
reported unavailable rather than returning fabricated container rates.

**Start live traffic** opens a user-triggered POST SSE session at
`/api/native-extensions/<id>/traffic-stream`, with the same operation/scope/revision
binding. It samples every five seconds, ends after one minute, and aborts when the
drawer or view closes. Each sample rechecks extension approval, package identity,
traffic grant and fresh user stack access before crossing the private gRPC broker.
No routine view polling or automatic unbounded reconnect loop is used. Sampling
is bounded to 32 selected running workloads, with four concurrent stats reads.

## Go services: shared gateway and explicit note writes

The [Go SDK workspace](extension-sdk-workspace.md) now provides `GetNote` and `PutNote` with independent
`storage.service.read` / `storage.service.write` global grants. These explicitly
authorize service access without an administrator session; the browser-only
`storage.read` / `storage.write` grants do not grant machine access. A caller
supplies its current approval revision and the note's last version. Host-side
package/grant checks, 16 KiB UTF-8 validation, optimistic concurrency and the
metadata-only audit commit occur in one datastore transaction. Writes are not
automatically retried. Notes are extension-owned application data, not a secret
store or Docker mutation API.

One shared gateway can listen on a private `unix:///.../gateway.sock`, retaining
mTLS and exact package identities. It requires an existing private parent directory
and creates a mode-0600 socket without overwriting existing paths. Unix SDK clients
must supply the TLS server name from the server certificate. Containers can share
a private socket volume or use one private gateway DNS address; no published port
is needed on every stack. Keep the Docker socket with Vessel, not extension services.

The prepared development backend uses the `vessel-extension-dev-gateway-20261016`
volume at `/run/vessel-extensions`, with a separately approved notes identity.
A static SDK notes client was run read-only, with capabilities dropped and
`--network none`, and persisted a note through that socket. The native Notes UI
reads the same datastore record. Certificates in this local setup are 24-hour
development fixtures; production issuance/rotation and managed service lifecycle
remain future work. This is a tested development read/write SDK, not a published
stable extension service platform. Reverse service routing and infrastructure
mutation APIs are also not implemented.

A stopped or crashed gateway can leave its Unix socket behind. The listener
intentionally refuses to overwrite an existing path. Stop the owning server and
verify that no other listener uses the dedicated volume before removing only the
stale socket and restarting. The current development backend does not manage
this recovery automatically; production lifecycle supervision remains future work.
