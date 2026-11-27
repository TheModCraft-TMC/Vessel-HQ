# Compose portability and CLI interoperability (#300)

Portable project export, upload preview, reviewed import and filesystem revision
checks are implemented. The November 26 acceptance below covers a local Docker
engine and records the remaining browser and editor work.

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

## November 26 acceptance

- Vessel exported a project with `compose.yaml` and `配置/override.yaml`, imported
  the archive, restored it to a separate directory and verified both file
  checksums. Docker Compose CLI 5.1.4 rendered the supplied image variable and
  kept the UTF-8 override. Docker Desktop engine 29.4.3 ran the restored project.
  The container exited successfully with `grüezi` in its log. The disposable
  project container and network were removed after the check.
- The Docker exec WebSocket received all 2,059 expected bytes from an Alpine
  PTY, including a Unicode character across the 2 KiB read boundary and output
  sent as the session ended. The disposable PTY container was removed.
- The Docker log viewer uses stable time-window choices across rerenders.
  Restarting a stopped stream uses the selected window against the current
  time. A reconnected socket replaces the earlier tail when its first output
  arrives. The same viewer serves containers, services and tasks, with bounded
  retention and filtering of the fetched lines.
- The editor reports YAML syntax location and the portable ZIP preview reports
  the file and available parser line. Validation messages omit parser excerpts
  that could contain literal or interpolated values.
- Focused frontend tests passed for the log view and stream (24 tests) and the
  YAML validator and stack editor (41 tests). The WebSocket, portable project
  and stack handler Go packages passed with the race detector enabled.

## Convert a Docker run command

Open **Convert Docker run to Compose** in the Docker Compose stack editor, paste
one literal `docker run` command, and select **Preview Compose**. **Insert YAML**
fills an empty editor. **Copy YAML** lets you merge the result into an existing
draft. Review the rendered service before deploying it.

The converter accepts a literal image and command arguments, shell quoting and
line continuations, `--name`, explicit `NAME=value` environment settings,
single-port mappings, volumes, a restart policy, user, working directory,
entrypoint, stdin and TTY options. Compose controls attachment independently
of Docker run's `-d` flag. A volume can use an absolute target and an absolute
or named source with `ro` or `rw` access. Unsupported options such as `--rm`,
shell pipelines and shell expansion produce an error before generating YAML.

## Separate follow-up slices

- Compose diagnostics: preserve locations and redact source-dependent values in
  engine and interpolation errors shown after deployment validation.
- Logs/terminal: specify search scope, bounded retention, reconnect behavior,
  keyboard handling and phone acceptance against the existing streaming paths.

Each slice needs its own implementation and verification record. The comparison
claims and third-party recommendations in #300 are context, not acceptance tests
or a requirement to replace Vessel's existing platform/access-control workflows.
