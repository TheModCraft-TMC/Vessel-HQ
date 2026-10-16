# Native extension candidate builder

This is a development/release tool, not an upload endpoint or production installer.
It builds administrator-trusted native UI in a disposable, network-disabled container.
No extension-defined install hooks, dependencies, shell commands, route patches or
core overrides are accepted. It never switches the running console.

## Trusted baseline and staging

Create the baseline **only from a reviewed Vessel release checkout**. Store its
digest in the independently managed release metadata. Creating a new baseline
after an extension changes files defeats the integrity boundary.

```sh
node scripts/native-extensions/builder.mjs baseline /trusted/vessel /tmp/vessel-baseline.json
# Copy the printed digest from trusted release metadata for subsequent commands.
node scripts/native-extensions/builder.mjs verify /trusted/vessel /tmp/vessel-baseline.json TRUSTED_SHA256
node scripts/native-extensions/builder.mjs inspect examples/native-extensions/environment-summary
node scripts/native-extensions/builder.mjs stage /trusted/vessel /tmp/vessel-baseline.json TRUSTED_SHA256 /tmp/vessel-candidate examples/native-extensions/environment-summary
```

The candidate directory must not exist and must be outside the source checkout.
The complete frontend source, scripts, patches, mocks, Storybook configuration,
package/lockfile and listed root frontend configuration are protected. The fixed
policy in `builder.mjs` records directory membership, file hashes and executable
bits, rejecting additions, deletions, modifications, special files and symlinks.
Root backend files and documentation are not build inputs and are not copied.
Caches, local `.env` files and build outputs are neither trusted nor copied.

An extension contains `manifest.json`, optional non-executable `.ts`, `.tsx`, or
`.css` files under `ui/`, and optional declared Linux ELF64 backend executables.
Native UI declares a default-exported component and `extension.page` or
`docker.stack.detail.action` slots. No
separate frontend dependency graph is currently supported.
The trusted TypeScript parser checks every source module before staging and again
before compilation. It rejects server directives (including escaped strings and
nested function directives), Next/server/Node imports, unknown dependencies,
relative imports outside the package, nonliteral dynamic imports, CommonJS,
import metadata and explicit `eval`/`Function` execution. Allowed dependencies are
`react`, its JSX runtimes, `lucide-react`, `@xyflow/react` and its style sheet,
`@/core/native-extensions/sdk`, and named `@/ui/` modules. This policy
uses Vessel's existing pinned TypeScript dependency; no package dependency is
installed by the builder.
Package digests are SHA256 over the canonical source inventory excluding
`manifest.json`; the manifest gets its own digest. Development `README.md`,
`ui/**/*.test.ts[x]`, `ui/**/*.spec.ts[x]`, and `__tests__` files are omitted from
the authoring inventory and archive. `digest` prints the calculated
source digest for a package author to write into a reviewed manifest. `inspect`
and `pack` require that declared digest to match. This is integrity metadata, not
publisher provenance.

The assembler copies only frontend source and the manifest into
`web-src/core/native-extensions/packages/<id>/` and generates the fixed registration
module. Backend executables never enter the browser source tree and are not
executed by the builder; receipts bind their hashes and report
`runtimeStaged: false`. Registrations use lazy imports; the host checks current approval and the
exact package digest before loading the component. Slots do not introduce Next.js
routes, server actions or middleware. Native JavaScript is trusted console code;
checksums do not constrain its browser behavior. Native modules are client UI and
the assembler prepends `use client` to staged TypeScript modules and the generated
registration wrapper. This trusted transformation is bound by the candidate input
digest; the package digest still identifies the original reviewed source. The
host must defer loading/rendering until the browser mounts, because `use client`
alone does not prevent Next.js SSR. Static source checks do not prove arbitrary
JavaScript safe. Build-time execution remains inside the container.

The resulting `candidate.json` is a local diagnostic receipt. It is not a signed
attestation, permission grant or production activation authorization.

## Create an uploadable .vesselhq package

```sh
node scripts/native-extensions/builder.mjs pack examples/native-extensions/environment-summary /tmp/environment-summary.vesselhq
```

The new output file is a standard ZIP named `.vesselhq`; upload it through the
administrator extension screen. Packing verifies the manifest, complete source
inventory, client source policy and optional backend executable headers. It never
executes extension code. The dependency-free writer uses ZIP STORE/DEFLATE, fixed
1980 timestamps, regular 0644 frontend files, and 0755 declared backend files.
It excludes machine metadata and refuses existing output files or outputs inside
the package. Limits match the server validator: 64 MiB archive, 256 MiB expanded,
128 MiB individual file, 512 entries, depth 16 and compression ratio at most 100.

Cross-language canonical digest contract:

- Paths use ASCII `[A-Za-z0-9._/-]`, at most 256 bytes, with no empty, `.` or `..`
  segments, absolute paths, backslashes, symlinks or special files.
- Inventory keys use ASCII lexicographic order. Include all source directories,
  including implicit ZIP parent directories; omit the root and `manifest.json`.
- Directory values are `{"type":"directory"}`. File fields occur in exact order
  `type`, `digest`, `executable`; digest is lowercase SHA256 hex of the raw bytes.
- UI files use `executable:false`. Exactly the binaries declared by
  `backend.entrypoints` use `executable:true`, regardless of source filesystem mode.
- Serialize with two-space indentation, normal JSON strings and one final newline;
  SHA256 those bytes and prefix the resulting hex with `sha256:`.

Optional backends use this descriptor:

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

Declare only architectures included in the package. Payloads must be little-endian
ELF64 executables or shared-position executables with matching AMD64/AARCH64
machine headers. Shell scripts, install hooks and undeclared backend files are
rejected. A package may supply UI, backend, or both. Uploaded binaries remain inert;
packaging and storage do not authorize execution or grant capabilities. See the
[Go backend package example](../../examples/native-extensions/environment-summary-service/README.md)
for building a real reference binary without committing artifacts.

## Provision a trusted builder image

Use a private temporary build context containing only:

- `package.json`, `pnpm-lock.yaml`, and `patches/` from the reviewed release.
  Do not copy host `node_modules`: native Darwin packages cannot run in Linux.
- `lock.sha256`: the lowercase SHA256 of that exact `pnpm-lock.yaml`, plus newline.
- `validate.mjs` and `Dockerfile.builder` from the trusted release tooling.

Build `Dockerfile.builder` with `NODE_IMAGE` set to a reviewed Node 24.21+ base image
pinned by digest. Publish/identify the resulting builder by its own image digest.
The supplied Dockerfile expects a Debian-based Node image and provisions git and
ripgrep for the existing architecture guards. Git metadata is created afresh in
the disposable candidate; the real checkout's `.git` is never mounted.
Image provisioning is an operator/release action; the extension CLI never installs
packages or builds a toolchain image. The image must include pnpm 10.26.2 and the
approved dependency tree; changing either requires a new image review. The
Dockerfile installs with `--ignore-scripts`, then runs only the reviewed native
`@swc/core`, `esbuild`, and `unrs-resolver` rebuilds. The default official Node
24.21.0 Bookworm base is digest-pinned. Network access is used only while
provisioning this trusted toolchain, before any extension source is supplied.
Use `docker build --iidfile` to retain the immutable local image ID; `build`
accepts `sha256:<image-id>` as well as registry `name@sha256:<digest>` references.

```sh
node scripts/native-extensions/builder.mjs build /tmp/vessel-candidate registry.example/vessel-builder@sha256:IMAGE_DIGEST TRUSTED_RECEIPT_SHA256
```

The command is synchronous for now; a future queue can run it in the background.
The staging command prints `receiptDigest`. An independent trusted controller must
retain that digest and supply it to `build`; never derive it by hashing candidate
files immediately before building. Both the receipt and input inventory are
editable candidate files, so their internal hashes alone are not a trust anchor.
It invokes only the fixed architecture, typecheck, test, lint and production build
commands. Each check runs in a fresh container with no network, host socket,
production mounts or inherited production environment, a read-only image,
unprivileged UID, dropped capabilities, no-new-privileges and resource limits.
Each check has a 15-minute deadline; timeout or interruption requests forced
container removal. If Docker itself is unavailable during cleanup, verify that
the named `vessel-extension-*` container has stopped before retrying.
Only the sanitized candidate workspace is writable; `/tmp` and dependency caches
are ephemeral. A separate container seeds a fresh dependency volume from the pinned
image without mounting candidate code. Each check mounts that volume read-only at
`/workspace/node_modules`, with writable temporary cache overlays. Keeping packages
inside the workspace allows Next.js standalone dependency tracing without mutable
dependencies or absolute links into the image. The image validator checks its
dependency lock digest before each command. A host-side verifier checks candidate
inputs after every check. The volume is removed on completion or failure; cleanup
warnings name any volume the operator needs to remove.

Container isolation depends on the operator's Docker/kernel security. Do not run
this as a privileged production-host service. The current tool does not provide a
build queue API, log sanitization, provenance verification or production deployment
adapter. Container output should stay in a trusted operator terminal.

All checks must succeed for `validated` status. Failures record `failed`; the
running console remains untouched. Even `validated` candidates retain
`activatable: false`: browser/health checks, grant-revision binding, artifact
attestation and production serving/rollback integration are still required.


## Development-only compile and selection

Build the trusted extractor from the reviewed core:

```sh
go build -o /tmp/vessel-extension-package ./backend-src/cmd/vessel-extension-package
```

For compilation without activation or grants, create a trusted baseline and stage
an exact archive using its externally retained archive digest:

```sh
node scripts/native-extensions/builder.mjs baseline /trusted/vessel /tmp/vessel-baseline.json
node scripts/native-extensions/builder.mjs stage-archive /trusted/vessel /tmp/vessel-baseline.json BASELINE_SHA256 /tmp/vessel-candidate /tmp/stack-network-overview.vesselhq sha256:ARCHIVE_SHA256 /tmp/vessel-extension-package
node scripts/native-extensions/builder.mjs build /tmp/vessel-candidate sha256:BUILDER_IMAGE_ID STAGED_RECEIPT_SHA256
```

The extractor reuses the backend's full ZIP inspector before writing inert files
into a new private directory. The assembler then validates source policy again.
The generated registrations preserve declared slots and use lazy client imports.
Checks include the reviewed reference example suite (`test:extensions`) alongside
the full suite; trusted example sources/configuration are protected build inputs.
Tests use four workers; each container has 6 GiB memory, 4 CPUs and 256 PIDs.

For an explicitly approved package in a **disposable local development checkout**,
the operator controller performs the entire pipeline and selects only the generated
package namespace on success:

```sh
node scripts/native-extensions/develop.mjs --development \
  --source /trusted/vessel --baseline-file /tmp/vessel-baseline.json \
  --baseline-digest BASELINE_SHA256 --candidate /tmp/vessel-approved-candidate \
  --archive /tmp/stack-network-overview.vesselhq --archive-digest sha256:ARCHIVE_SHA256 \
  --extractor /tmp/vessel-extension-package --image sha256:BUILDER_IMAGE_ID \
  --api http://127.0.0.1:19000 --token-file /tmp/private-operator-token \
  --extension-id stack-network-overview --package-digest sha256:SOURCE_SHA256
```

The token file contains one bearer token, has mode 0600, and stays outside the
source/candidate. The API must be loopback. The controller only reads approval;
it never uploads packages, grants permissions, or starts backend payloads. It
checks the exact uploaded archive/source digests, revision, current grants and
native trust before and after compilation and around selection. A changed
approval rejects the candidate. Credentials never reach build containers.

The initial controller requires an empty compiled extension namespace so it cannot
silently discard existing extensions. After successful isolated checks, it swaps
only `web-src/core/native-extensions/packages/` and the trusted generated registry,
with rollback if selection or fresh approval checks fail. It compares all other
protected inputs against the reviewed baseline. Next.js development reloads the
selected source; run browser checks before treating the result as verified. Native
client modules are administrator-trusted code; source selection into a development
checkout is not a production artifact deployment mechanism.

Every production receipt remains `activatable:false`. The development selection
record explicitly reports `productionActivatable:false` and
`browserSmokeRequired:true`. Production artifact signing/serving, health checks,
replica coordination, complete-set updates and emergency rollback remain required
before enabling UI-driven production builds or activation.

## Tests

```sh
node --test scripts/native-extensions/*.test.mjs
```

These test protected source tampering, digest substitution, new files, deletions,
symlinks, namespace escape, unsafe manifests, duplicate packages and failed build
preconditions. The tests do not require Docker or execute extension code.

### Compile several approved packages together

To include Network Overview and Persistent Notes in the same candidate, write an
operator-owned JSON file outside the checkout containing the exact package set:

```json
[
  {
    "extensionId": "stack-network-overview",
    "archive": "/tmp/stack-network-overview.vesselhq",
    "archiveDigest": "sha256:REVIEWED_ARCHIVE_DIGEST",
    "packageDigest": "sha256:REVIEWED_SOURCE_DIGEST"
  },
  {
    "extensionId": "persistent-notes",
    "archive": "/tmp/persistent-notes.vesselhq",
    "archiveDigest": "sha256:REVIEWED_ARCHIVE_DIGEST",
    "packageDigest": "sha256:REVIEWED_SOURCE_DIGEST"
  }
]
```

Replace the digest placeholders with the packer's output, upload both packages,
and separately approve their permissions. Use the same controller command above,
replacing the single-package `--archive`, `--archive-digest`, `--extension-id` and
`--package-digest` arguments with `--packages-file /tmp/approved-packages.json`.
All other arguments remain required. The set must contain 1–32 unique IDs. Every
archive is revalidated by the Go extractor before staging. All package approvals
must remain unchanged for the entire build and selection. The initial development
controller still requires an empty compiled namespace; use a fresh disposable
checkout for a new complete-set build rather than overwriting an existing set.

[Persistent Notes](../../examples/native-extensions/persistent-notes/README.md)
demonstrates explicit write-back with independent note-read and note-write grants,
transactional persistence/audit and optimistic concurrency. It needs no executable
backend or separately configured external gRPC listener.

Staging normalizes Next.js's generated development type imports in
`web-src/next-env.d.ts` to production type paths **inside the candidate only**.
This avoids a false integrity failure when the reviewed source was last opened
with `next dev`. The candidate input inventory binds this trusted transformation;
the original source declaration and all other protected inputs remain unchanged.

The protected source inventory includes root `translations/`: frontend test setup
imports the reviewed English JSON from there. Translation additions, deletions,
and content changes invalidate the baseline just like console source changes.

The validator assigns the production build a fixed 4 GiB V8 heap inside its 6 GiB
container. Node's automatic ~2 GiB heap in that container is insufficient for the
full console webpack build. Other checks keep their default heap. This setting is
part of the reviewed validator image, never inherited from operator or extension
input; provision a new pinned builder after changing it.
