# Compose portability and CLI interoperability (#300)

Status: source implementation in the working tree, November 15, 2026. Portable
project export, upload preview, reviewed import and filesystem revision checks
are implemented. Runtime/CLI and browser acceptance remain open. This separates
#300 from the broader #299 work.

## Existing behavior

Vessel already reads the entry-point Compose file from
`Stack.ProjectPath`/`Stack.EntryPoint` through
[`stackFile`](../../backend-src/api/http/handler/stacks/stack_file.go).
Stack metadata, access controls, source configuration and deployment state live
in the datastore. The issue's claim that all Compose content is stored only in
an obfuscated database does not describe this implementation.

The stack file API checks environment/resource permissions and refuses
to serve a stale Git checkout after source settings change. Default inspection
returns the entry-point file; `format=project` returns a multi-file archive.
The same permissions and stale-source checks apply to both. The archive includes the declared
entry point and additional Compose files in their original deployment order,
checksums and environment names, with explicit external-requirement notices.

The create form accepts the exported ZIP, previews each file and requires explicit
confirmation bound to the exact archive digest before deployment. Validation alone
does not access an engine. Compose and Swarm builders preserve the override order.
The editor sends the quoted revision returned by file inspection as `If-Match`;
stale input is rejected before saving. Reload requires discarding edits explicitly.
After a successful save the editor advances its revision without reinitializing
edits entered while the deployment request was pending.

## Smallest complete portability workflow

1. Export an authorized stack's entry-point Compose file and explicitly known
   additional Compose files as a downloadable project. Preserve their relative
   paths and original bytes. Reject missing files, symlinks and paths escaping
   the project directory; never return a partial archive as a successful export.
2. Include a manifest describing file paths, checksums, required environment
   variable names and external requirements. Do not implicitly expand Vault
   values, registry/Git credentials, runtime secrets or stored environment values.
   Literal values already present in the source file remain source content and
   must be described as such before download.
3. Explain dependencies that cannot be included automatically: relative bind
   directories, build contexts, external networks/volumes and secret/config files.
   The export must not claim to be self-contained when these are unresolved.
4. Provide import validation and a review of the resulting project before any
   deployment. A plain export or validation must not contact or mutate an engine.

Acceptance: a representative multi-file project exports with deterministic paths
and checksums, imports without losing Compose overrides, and can be validated by
the supported Compose CLI after the operator supplies external inputs. Unauthorized
users cannot export it; traversal/symlink/missing-file cases fail without exposing
unrelated host files. Tests must cover Unicode filenames/content and cancellation.

## Filesystem reconciliation

Define explicit ownership for a managed directory before enabling external edits.
The server's project path is not necessarily a directory on the Docker endpoint.
Do not infer filesystem access merely from access to its Docker socket.

For a locally accessible managed directory, record a content revision across every
owned Compose file. Reject a save or deployment based on an obsolete revision and
show a conflict that lets the operator reload/review changes. Preserve external
bytes on conflict. A filesystem change must not silently trigger a redeployment.
Git-backed projects retain their source reconciliation rules; editing a cached
checkout must not silently become a different source of truth.

Acceptance requires external edit -> visible new revision -> stale save rejection
-> explicit review/deploy, plus recovery after restart. A remote agent/host-file
protocol and filesystem watcher deployment are separate designs, not implied by
this local workflow. #299 owns broader remote-environment and synchronization work.

## Separate follow-up slices

- Compose diagnostics: preserve parser line/column and actionable errors through
  the API/editor while sanitizing paths and secret-bearing interpolation output.
- Editor assistance: evaluate the existing YAML/editor implementation before
  adding completion, validation or a Docker-run conversion action. Define the
  supported input subset and report unsupported flags before conversion.
- Logs/terminal: specify search scope, bounded retention, reconnect behavior,
  keyboard handling and phone acceptance against the existing streaming paths.

Each slice needs its own implementation and verification record. The comparison
claims and third-party recommendations in #300 are context, not acceptance tests
or a requirement to replace Vessel's existing platform/access-control workflows.
