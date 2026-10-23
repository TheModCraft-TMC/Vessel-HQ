# Vessel Code Mode adapter

Implements [#243](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/243) as a
standalone Node 24 MCP adapter. It discovers operator-configured MCP servers,
compiles selected tool schemas into TypeScript declarations, and runs generated
workflows in a local resource-bounded VM. Vessel's application has no existing
agent loop to migrate; this package supplies the execution backend, prompt and
MCP entrypoint for an agent client. It does not start inside Vessel production
or grant access merely by installing it.

## Install and connect

Use Node 24.21.0+ in the 24.x line and pnpm 10.26.2:

```sh
pnpm --dir tools/vessel-mcp install --frozen-lockfile --ignore-scripts
pnpm --dir tools/vessel-mcp test
pnpm --dir tools/vessel-mcp benchmark
node tools/vessel-mcp/src/server.mjs
```

Configure your MCP client to launch the last command from this repository.
Stdout is exclusively MCP protocol output. Startup errors go to stderr without
credentials. Inject secrets from Keychain or your credential manager into the
process environment; never put them in command arguments, source, client JSON
or shell history.

| Environment | Meaning |
| --- | --- |
| `VESSEL_MCP_URL` | Vessel HTTPS origin or `/api` URL; loopback HTTP is allowed only for development |
| `VESSEL_MCP_API_KEY` | Required host-side API identity; use the least privilege identity supported by your deployment |
| `VESSEL_MCP_ENVIRONMENT_IDS` | Required comma-separated positive IDs; narrows the API identity's permissions |
| `VESSEL_MCP_UPSTREAM_CONFIG` | Optional path to operator-owned JSON described below |
| `VESSEL_MCP_STATE_DIRECTORY` | Optional dedicated private `0700` directory for encrypted approval continuations |
| `VESSEL_MCP_STATE_KEY` | Optional 32-byte key encoded as 64 hex characters, injected from a credential manager; required with the state directory |

The seven built-in operations expose metadata reads for environments, Docker
containers/images/networks/volumes, stacks and Kubernetes namespaces. They
exclude inspect/environment variables, logs, exec, credentials and raw URLs.
The host calls Vessel on every invocation; server-side authorization still
applies and revoked credentials fail on the next request. Explicit environment
scope is checked locally too. Redirects are rejected.

## Connect other MCP servers

The operator owns this configuration; it is never accepted as an execute input.
Only allowlisted tools are exposed. Example with a placeholder local executable:

```json
[
  {
    "name": "inventory",
    "command": "/absolute/path/to/inventory-mcp",
    "args": [],
    "env": { "INVENTORY_TOKEN": "OPERATOR_INVENTORY_TOKEN" },
    "tools": [
      { "name": "list_hosts", "approval": false },
      { "name": "update_host", "approval": true }
    ]
  }
]
```

`env` maps upstream variable names to host environment variable **names**, not
secret values. Upstream processes receive only explicitly mapped variables plus
SDK transport defaults; the generated VM receives none. Launch by an absolute
executable path for predictable resolution. Stdio servers are supported; remote
HTTP transport/OAuth registration is outside this package's current interface.
Upstream processes are trusted host integrations, not code executed inside the
VM. Do not connect untrusted server executables. Tool descriptions and schemas
remain untrusted data and are never interpolated as executable instructions.

Pagination is supported and bounded. Unknown/missing configured tools fail
startup. Tool names become `inventory.list_hosts`; duplicate names are rejected.
Approval defaults to true. Marking a tool `approval: false` is an explicit
operator trust decision: remote read-only annotations alone grant no authority.
Schemas validate on the host using local JSON Schema draft 7/2019/2020 support;
remote `$ref` URLs are not fetched. Schema complexity is bounded by a 1 MiB
catalog limit and discovery caps. Unsupported schemas fail startup.

## Agent execution

The MCP initialization instructions expose `src/prompt.mjs`. Agents can also
import `SYSTEM_PROMPT` directly. Only five meta-tools are registered regardless
of the number of connected operations:

1. `search_tools`: names, tags, short descriptions and approval requirements.
2. `get_schemas`: selected JSON Schemas plus a generated `declare const tools` SDK.
3. `get_tags`: categories.
4. `execute`: a TypeScript **function body**, with async tool calls.
5. `resume`: an opaque continuation ID; never an approval capability.

Example after discovering and inspecting the operations:

```ts
const environments = await tools["environments.list"]({});
const summary = [];
for (const environment of environments) {
  if (environment.Type === 1) {
    const containers = await tools["docker.containers.list"]({
      environmentId: environment.Id,
    });
    summary.push({
      environment: environment.Name,
      running: containers.filter((item) => item.State === "running").length,
    });
  }
}
return summary;
```

Intermediate payloads stay in the VM/host execution path. Only the explicit
return value is sent to the client; stdout and native traces are discarded.
Generated output types are `unknown` when a server supplies no output schema.
Complex/unresolved schema types fall back to `unknown` rather than inventing a
contract. TypeScript annotations are parsed/stripped, not statically typechecked;
host validation is authoritative. Zapcode supports a subset of JS/TS, not Node
or arbitrary npm. Its regular expressions and full Promise APIs are unsupported;
undefined identifiers can evaluate to null rather than throw. Test workflows
against these documented semantics.

## Suspension, approval and restart

Before a protected operation runs, execution returns `approval_required`, an
opaque `continuationId`, and the pending name/arguments. With persistent state
configured, a VM snapshot is encrypted using AES-256-GCM with the continuation
ID authenticated as associated data. Files are `0600` in a private directory;
no API key or upstream credential is put into the snapshot. Tool data may still
be sensitive. Retain and back up the state key only in your credential system.

An operator reviews the exact pending call using the separate host command:

```sh
node tools/vessel-mcp/src/server.mjs inspect CONTINUATION_ID
node tools/vessel-mcp/src/server.mjs approve CONTINUATION_ID
```

These commands use the same securely injected configuration. Inspect output
contains the pending arguments: review locally and do not paste private values
into tickets. The model's MCP tool interface exposes no approve command. The
client then calls `resume` with the ID. A fresh adapter process can resume the
saved VM state without rerunning earlier calls. Approval permits only that one
pending invocation. A second protected invocation suspends again. No approval
store means protected calls fail before execution.

Snapshots expire after 24 hours; at most 100 pending files are retained, with
expired/invalid files collected when another state is saved. A changed server
configuration, schema, API identity, credential binding or environment scope
invalidates old continuations. Resume consumes an approved state before invoking
the host operation; replay and concurrent resume fail. A crash during a write
can leave an unknown remote outcome: inspect/reconcile it manually; **do not
re-execute automatically**. There is no distributed exactly-once claim.

## Limits and isolation

- 10 seconds total active VM/host execution, across resumes; operator wait is excluded.
- 50 MiB VM heap, 50 host invocations across resumes, 32 KiB caller code.
- 16 KiB operation arguments, 1 MiB host result, 256 KiB final output, 2 MiB snapshot.
- One execution at a time per adapter and 120 host calls per minute per process.
- No guest filesystem, network, process, module loader or environment bindings.
- Host credentials never enter the VM. Known credential strings and sensitive
  field names are redacted from upstream results; redaction is defense in depth,
  not a way to make arbitrary confidential tool data safe for an agent.

A new child process with empty environment executes each VM segment. Host deadlines
kill the process even if the native interpreter fails to interrupt. V8 memory
is separately bounded; the 50 MiB limit applies to the guest VM heap, not total process RSS. Host calls
receive cancellation; a timeout ends the workflow, but cannot undo an operation
already accepted remotely. Treat connected integrations and returned data
according to the API identity's permissions. No logs/telemetry are sent externally.
For multiple users, run separate adapter processes/keys/scopes; this stdio adapter
is not a public multi-tenant service.

## Runtime choice and evidence

[Zapcode](https://github.com/TheUncharted/zapcode) 1.5.3 supports portable snapshots
and TypeScript parsing directly. NPMScan's comparison preferred QuickJS with high
confidence for its usage/maturity; the required serializable continuation API
makes Zapcode the functional fit here. It is experimental and sparsely used.
Neither the upstream 2-microsecond cold-start claim nor absolute sandbox security
is claimed for this adapter. Dependencies are pinned, lifecycle scripts are
ignored, and platform native binaries come through pnpm's integrity lockfile.

Tests exercise actual MCP stdio server/client processes, connected-server
schema discovery, generated declarations, multi-step async workflows, external
approval and resume after restart, token/schema handling, cancellation, memory,
CPU/output/call limits, no host capabilities, encrypted state tampering, drift,
concurrent consumption and replay. `benchmark` reports actual `cl100k_base`
token counts for real and synthetic catalogs and deterministic workflow success
and timing. It makes no unmeasured production LLM accuracy/latency or 99% claim.

[Recorded local benchmark](../../docs/planning/code-mode-benchmark-2026-10-23.md).
