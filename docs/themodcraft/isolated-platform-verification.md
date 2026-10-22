# Isolated live-platform verification

This is scoped **live verification**, not a replacement for unit tests or a claim
that every external integration has been exercised. The harness starts the actual
Vessel API from a supplied Linux binary and talks to actual disposable engines,
a Kubernetes cluster, an official Edge agent, and an OIDC provider. It never
initializes Swarm on the shared host or changes the user's Kubernetes context.

## Reproduce

Requirements: Python 3, Docker with privileged Linux container support, a Linux
Vessel binary matching the Docker server architecture, and a local runtime image
providing the binary's normal runtime dependencies. This run used Docker Desktop
Linux ARM64, Go 1.26.6, and the existing `vessel-issues-toolkit:arm64` tool image.
No product dependency is installed or changed by this harness.

```sh
export PATH=/Users/josh/.nvm/versions/node/v24.22.1/bin:$PATH

# Use the updated dependency artifact here, not a historical build.
VESSEL_BINARY=/absolute/path/to/linux-arm64/portainer
RUNTIME_IMAGE=vessel-issues-toolkit:arm64

python3 scripts/integration/platform_smoke.py \
  --binary "$VESSEL_BINARY" --runtime-image "$RUNTIME_IMAGE" \
  --suites docker,swarm,podman,edge \
  --output /tmp/vessel-rest-platform-engines.json
```

`--artifact` is an alias for `--binary`. Results contain the binary SHA256,
resolved fixture image digests, maintained release/datastore identities,
individual checks, durations, and cleanup failures. They deliberately exclude
runtime environment values, administrator passwords, OAuth tokens, and Edge keys.
**Do not infer coverage of updated Go dependencies from a baseline binary run.**

### Kubernetes

Install kind outside the repository from its official distribution. The following
Darwin ARM64 checksum was verified against the published v0.31.0 checksum file:

```sh
mkdir -p /tmp/vessel-rest-platform-tools
curl -fsSL https://kind.sigs.k8s.io/dl/v0.31.0/kind-darwin-arm64 \
  -o /tmp/vessel-rest-platform-tools/kind
printf '%s  %s\n' \
  88bf554fe9da6311c9f8c2d082613c002911a476f6b5090e9420b35d84e70c5c \
  /tmp/vessel-rest-platform-tools/kind | shasum -a 256 -c -
chmod +x /tmp/vessel-rest-platform-tools/kind

python3 scripts/integration/platform_smoke.py \
  --binary "$VESSEL_BINARY" --runtime-image "$RUNTIME_IMAGE" \
  --kind /tmp/vessel-rest-platform-tools/kind --suites kubernetes \
  --output /tmp/vessel-rest-platform-kubernetes.json
```

On another OS/architecture, use the corresponding official binary and published
checksum rather than this Darwin ARM64 checksum. `kubectl` must also be installed.
The harness creates a private Docker network, an explicit private kubeconfig, and
a single kind node. It loads the **local** runtime image without publishing it,
mounts the supplied binary into that node, and runs Vessel as a real in-cluster
Pod with its own service account/cluster-role binding. Only the temporary cluster
receives that administrator binding. A bounded, owned `kubectl port-forward`
exposes Vessel on a random host loopback port.

Running Vessel outside Kubernetes with only `DEV_KUBECONFIG_PATH` is insufficient
for this full smoke: production proxy token loading and stack deployment also
need the in-cluster service-account mount and `kubernetes.default.svc` DNS. The
harness therefore exercises the production in-cluster topology instead of mocking
those requirements or modifying product code.

### Real provider and browser OAuth

The small official Dex OIDC fixture was selected instead of a multi-service
Authentik deployment to stay within the shared Docker VM's 8.32 GB budget. This
is a real provider password login, authorization-code redirect, token exchange,
and UserInfo request—not a fabricated JWT or token-only approval.

Install a browser driver in disposable storage, not in the repository:

```sh
npm install --prefix /tmp/vessel-rest-platform-tools/browser \
  --ignore-scripts --no-audit --no-fund playwright@1.58.2

python3 scripts/integration/platform_smoke.py \
  --binary "$VESSEL_BINARY" --runtime-image "$RUNTIME_IMAGE" \
  --suites oauth \
  --playwright-module /tmp/vessel-rest-platform-tools/browser/node_modules/playwright \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --oauth-screenshot /tmp/vessel-rest-platform-oauth.png \
  --output /tmp/vessel-rest-platform-oauth.json
```

Alternatively, install Playwright's managed Chromium and omit `--chrome`. The
OAuth suite also requires `htpasswd` with bcrypt support. All client/account
credentials are generated at runtime, passed to the browser companion on stdin,
and stored only in a private temporary directory that is removed on completion.
Browser traces, HAR files, videos, login-form screenshots, and credential logging
are deliberately disabled.

Without a frontend artifact, an explicitly labeled companion HTTP callback page
passes the real provider's code to the actual Vessel API, checks standard-user
provisioning, and verifies denial of administrator-only settings. **That mode does
not cover Vessel's frontend callback component or frontend state handling.**

For the actual production frontend component, add:

```sh
  --frontend-standalone /absolute/path/to/web-src/.next/standalone
```

For example, the dependency-upgrade checkout's artifact is
`../dependency-npm/web-src/.next/standalone`. The artifact must be complete and
stable (not concurrently being rebuilt), with its sibling `.next/static` and
`web-src/public` directories available. The harness copies it into private temp
storage, changes only the copied generated server/routing manifests' baked-in
API rewrite from `http://localhost:9000` to its own Vessel instance, and starts its **own** loopback
server. It does not edit the source artifact or use another agent's server or
browser profile. That mode tests actual frontend invalid-state rejection without
a token exchange, OAuth login-link layout, provider login, callback exchange,
identity/ACL, post-login navigation, cookie-session restoration after reload, and
1100px/390px desktop/mobile layout without horizontal document overflow. Only the final application page and the
pre-login application page (no entered credentials) may be screenshotted.

### Combined run and account gates

```sh
python3 scripts/integration/platform_smoke.py \
  --binary "$VESSEL_BINARY" --runtime-image "$RUNTIME_IMAGE" \
  --kind /tmp/vessel-rest-platform-tools/kind \
  --suites docker,swarm,podman,kubernetes,edge,oauth,aci \
  --playwright-module /tmp/vessel-rest-platform-tools/browser/node_modules/playwright \
  --chrome '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --frontend-standalone /absolute/path/to/web-src/.next/standalone \
  --output /tmp/vessel-rest-platform-final.json
```

Exit codes: **0** all requested suites passed; **1** a test or cleanup failed;
**2** all runnable suites passed but an explicitly requested suite has an external
access gate. `aci` records a blocked status, never a simulated pass. It checks only
whether the normal Azure CLI is installed, Azure-related environment **names**,
and (if installed) `az account show` state metadata. It never initiates a login or
reads credential stores. Live ACI additionally needs an explicitly authorized
nonproduction subscription/service principal with Container Instances permissions
and approval for potentially billable resources; the harness does not manufacture
that authorization. On this machine the Azure CLI and Azure/ARM environment names
were absent. No Azure resource was created.

External Authentik-specific group synchronization remains separate from the Dex
provider smoke. SonarCloud authorization is owned by the parent verification
workflow and is not manufactured or modified here.

## Resource ownership and cleanup

- Each invocation generates a unique `vessel-rest-platform-<random>` prefix.
  Every created outer Docker container, volume, and network uses that prefix;
  kind's cluster/control-plane and nested Edge agent also use it.
- Docker and actual Linux Podman services listen on **127.0.0.1:2375 inside their
  own network namespaces**. Only their Vessel companion shares that namespace.
  No host Docker socket is mounted into Vessel, Podman, or the Edge agent. The
  Edge agent mounts only its nested DinD engine's socket/volumes.
- Only random **127.0.0.1** host ports for Vessel, the provider, frontend, and
  port-forward are opened. The public network is used only for official image
  pulls; nothing is pushed, published, or released.
- Container starts have 768 MiB/two-CPU limits; the nested Edge agent is limited
  to 256 MiB/one CPU inside its parent limit. The kind control-plane (including
  the Vessel Pod) is limited to 2 GiB/three CPUs. Heavy suites run sequentially;
  each suite releases its resources before the next one starts.
- Cleanup uses only recorded exact owned names. There is no `prune`, shared-host
  `swarm init/leave`, kubeconfig/context switch, or global Docker/Podman setting
  change. Anonymous engine volumes are overridden with owned named volumes.
- A failed test still attempts cleanup. Inspect `cleanup_failures` and the
  reported exact prefix after interruption. SIGKILL/host failure cannot guarantee
  cleanup: remove only those exact recorded resources, never a global prune.
- Private temp data/config/passwords and owned subprocesses are removed/stopped.
  Report JSON and explicitly requested safe screenshots remain in `/tmp`.

Read-only post-run checks:

```sh
docker info --format 'HostSwarm={{.Swarm.LocalNodeState}}'
docker ps -a --filter name=vessel-rest-platform --format '{{.Names}} {{.Status}}'
docker network ls --filter name=vessel-rest-platform --format '{{.Name}}'
docker volume ls --filter name=vessel-rest-platform --format '{{.Name}}'
```

## Fresh verification record (2026-10-22)

Baseline source: `2d88f8851`. Baseline Linux ARM64 binary SHA256:
`71f5bbc9e49ce89a8dac43d6656a4d57308666392518438fe1e7e5ef4ea4f033`.
It reports Vessel **1.3.1**, datastore/API compatibility **2.45.0**.

| Platform | Fresh baseline evidence |
| --- | --- |
| Docker 29.8.2 | Environment create/read/update/delete; running container create/read/rename/stop/delete and logs; Compose stack create/update/delete |
| Swarm 29.8.2, nested DinD | Separate manager init inside owned disposable engine; running stack service and updated task; stack CRUD; environment/container CRUD; shared-host Swarm remains inactive |
| Podman 5.8.1 | Actual privileged Linux Podman service using vfs; environment CRUD and running container CRUD/logs through Vessel's Podman path (not Docker relabeled as Podman) |
| Kubernetes 1.35.0, kind 0.31.0 | Real in-cluster Vessel Pod and service-account auth; namespace CRUD; ready Deployment CRUD; Kubernetes stack/ConfigMap create/delete; environment create/delete |
| Edge agent 2.45.0 | Official agent on owned nested engine; polling, reverse tunnel, actual environment Docker info and container CRUD/logs |
| Dex 2.45.1 / Chrome / Playwright 1.58.2 | Real provider browser login; actual production Vessel frontend callback and companion callback separately passed; actual token exchange/UserInfo; invalid-state rejection before token exchange; provisioned standard user and admin-setting denial; reload restores cookie session; 1100px/390px login and authenticated page layouts passed |
| ACI | **Blocked**, no Azure CLI/account authorization; no mock substituted |

Production dependency-upgrade frontend artifact tested with the baseline backend:
build ID `owEQDO4vt6hhNfr29wLKA`, generated standalone server SHA256
`fac6973c3f5c6becd513248b8620b332ee460fe1e23b473ea04d52db5997b9cd`.
Safe desktop/mobile screenshots are in `/tmp/vessel-rest-platform-frontend-oauth*.png`.
The source artifact was read-only; only its disposable copy was customized.

The final bounded/owned-resource baseline combined run is recorded in
`/tmp/vessel-rest-platform-base-combined.json` (six runnable suites passed, ACI
blocked, zero cleanup failures). Production frontend results are in
`/tmp/vessel-rest-platform-base-frontend-oauth.json`.

Updated Go-artifact results must be recorded separately with their actual artifact
fingerprint after rerunning; the baseline rows above do not certify an upgraded
Go dependency artifact.

Harness-only checks (no live resources required):

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s scripts/integration -p 'test_*.py' -v
node --check scripts/integration/oauth_browser.cjs
git diff --check
```

Fourteen safety/transport unit tests passed during implementation. These verify
resource ownership/bounds/cleanup, artifact identity, transport behavior, transient
startup retries, and explicit Azure access gates; they are not counted as live
platform coverage.
