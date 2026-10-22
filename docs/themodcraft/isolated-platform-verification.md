# Isolated live-platform verification

This is scoped **live verification**, not a replacement for unit tests or a claim
that every external integration has been exercised. The harness starts the actual
Vessel API from a supplied Linux binary and talks to actual disposable engines,
a Kubernetes cluster, an official Edge agent, and an OIDC provider. It never
initializes Swarm on the shared host or changes the user's Kubernetes context.

## Reproduce

Requirements: Python 3, Docker with privileged Linux container support, a Linux
Vessel binary matching its runtime image architecture, and a local runtime image
providing the binary's normal runtime dependencies. Prefer native execution;
configured cross-architecture emulation must be reported explicitly. The historical baseline used
Docker Desktop Linux ARM64, Go 1.26.6, and the existing
`vessel-issues-toolkit:arm64` tool image. The final exact-artifact run below uses
Go **1.26.10** with that same runtime image; the mounted executable, not the
image's compiler, determines the running backend's Go version.
No product dependency is installed or changed by this harness. The Podman fixture
installs `iptables-nft` from its signed Fedora repository (GPG checking explicitly
enabled) inside its disposable container and sets container-local
`NETAVARK_FW=iptables`. The minimal official image has no iptables executable;
its default nft firewall backend fails for nested Compose custom bridges on this
Docker Desktop kernel. This fixture adaptation does not change host/global
settings or skip actual container/Compose networking. The installed RPM version
is recorded (`iptables-nft-1.8.11-12.fc43.aarch64` in the baseline run).

Use the project's supported Node 24.x and pnpm 10.26.2 environment for the
optional browser/frontend tooling.

```sh
# Use the updated dependency artifact here, not a historical build.
VESSEL_BINARY=/absolute/path/to/linux-arm64/portainer
RUNTIME_IMAGE=vessel-issues-toolkit:arm64

python3 scripts/integration/platform_smoke.py \
  --binary "$VESSEL_BINARY" --runtime-image "$RUNTIME_IMAGE" \
  --suites docker,swarm,podman,edge \
  --output /tmp/vessel-rest-platform-engines.json
```

`--artifact` is an alias for `--binary`. At construction, the harness opens the
supplied executable once and copies its bytes into its private temporary directory
(no symlink or hard link). The source is an **explicitly trusted local CLI input**
from any directory, including an outside-repository `/tmp` build artifact or a
builder's symlink; the source is opened read-only. A four-byte ELF-magic check on
that same open stream rejects accidental `.env`/key/data-file selections before
copying any payload. This is only format-mistake protection, not an authenticity
check, architecture verifier, or traversal fix. This is not a repository-confined
file API or a sandbox for LLM-supplied paths/executables. Do not expose the CLI as
an untrusted remote execution service. It hashes and mounts that same snapshot for both Docker
and kind. A later atomic replacement, in-place rewrite, or removal of the builder's
source path therefore cannot change the mounted bytes or invalidate the recorded
hash. Results contain that snapshot's binary SHA256,
resolved fixture image digests, maintained release/datastore identities,
individual checks, durations, and cleanup failures. Startup also asserts the
maintained release from `RELEASE_VERSION` and datastore compatibility `2.45.0`
(overridable with `--expected-release`/`--expected-datastore` for future releases).
They deliberately exclude
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
browser profile. Before writing any copied metadata or merging assets, it rejects
escaping/cyclic symlinks in the private standalone tree; this includes linked
`server.js`, both routing manifests, ancestor directories, and preexisting asset
destinations. Asset inputs are also checked before dereferencing their links.
Safe relative package links that remain inside the private tree are preserved.
A harmless temp-only regression fixture demonstrates why this matters: unguarded
`copytree(..., symlinks=True)` followed by a write to a copied absolute symlink
**does change the source target**. Regression tests now reject both absolute and
relative escapes before any rewrite, while preserving the original target bytes.
The guard resolves strictly first, so cyclic links are rejected on Python 3.14 too
(nonstrict resolution there can leave a cycle unresolved without raising). Only
`FileNotFoundError` permits a nonstrict fallback, followed by the same root
containment check: internal optional/dangling package-bin links remain supported,
while dangling escapes, permission failures and cycles are not bypassed.
This is not a sandbox for arbitrary executable JavaScript: supply trusted builds. That mode tests actual frontend invalid-state rejection without
a token exchange, OAuth login-link layout, provider login, callback exchange,
identity/ACL, post-login navigation, cookie-session restoration after reload, and
1100px/390px desktop/mobile layout. The mobile check waits for the drawer's CSS
transition to finish, exercises search/sort controls with viewport and hit-testing
checks, and actually reopens/closes the drawer. A pointer-access failure remains
a failure even when keyboard activation permits the remaining checks to finish.
Partial OAuth/browser check results are preserved in the report on failure rather
than losing already completed provider/session checks. Only the final application page and the
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

Reports default to a securely created unique `vessel-rest-platform-results-*.json`
in Python's system temporary directory; the printed `Results:` path is retained
after private-fixture cleanup, including interruption. `--output` must name a **new** file. Reports and
published screenshots are created exclusively with mode `0600`; existing regular
files, hardlinks, symlinks (including dangling ones), and creation races are refused,
never truncated or followed. Use fresh filenames when repeating the examples.
Caller-chosen parent directories remain caller-trusted: this is no directory
sandbox, and a different user controlling the parent can still remove/rename
outputs. Choose private directories for sensitive local reports.

`--oauth-screenshot` selects a new PNG output (prefer a `.png` extension). The
browser first captures into private temporary storage, including all suffixed
login/mobile/failure captures; only those safe application captures are then
published with the same exclusive-creation policy. A collision on any suffixed
output fails the suite, may leave already-published captures, and never overwrites
the old file or its target. Private browser captures are removed during cleanup.

Use ordinary Python without `-O` or `PYTHONOPTIMIZE`: the CLI refuses optimized
execution rather than silently removing other suites' assertion checks. The
companion callback's identity/role verification is an explicit runtime failure,
not a programming assertion; errors still restore the administrator token, return
a safe HTTP 500, and never claim successful ACL denial on the failure page.

Exit codes: **0** all requested suites passed; **1** a test or cleanup failed;
**2** all runnable suites passed but an explicitly requested suite has an external
access gate; **130** interrupted (Ctrl-C/SIGTERM, with cleanup attempted). `aci` records a blocked status, never a simulated pass. It checks only
whether the normal Azure CLI is installed, Azure-related environment **names**,
and (if installed) `az account show` state metadata. It never initiates a login or
reads credential stores. Live ACI additionally needs an explicitly authorized
nonproduction subscription/service principal with Container Instances permissions
and approval for potentially billable resources; the harness does not manufacture
that authorization. On this machine the Azure CLI and Azure/ARM environment names
were absent. No Azure resource was created.

Authentik-specific group synchronization remains separate from the Dex provider
smoke. The [additional real local Authentik proof](../security/authentik-local-verification.md)
now covers actual provider authorization-code/UserInfo/team synchronization with
a companion callback, not the production frontend or external deployment policy.
SonarCloud authorization is owned by the parent verification workflow and is not
manufactured or modified here.

## Scoped PR #234 Sonar follow-up

These are source-level dispositions for the seven findings in the fresh public
snapshot, not a claim of remote transitions or a green current quality gate.

| Sonar finding | Disposition |
| --- | --- |
| `AaFi6JH3pea8zfGF2Be_`, `pythonsecurity:S8707` | Reviewed intentional trusted CLI **read**, not an HTTP-controlled path or write traversal. `main()` takes `args.binary` only from argparse; the callback never constructs a `Smoke` or assigns the binary path. The chosen source is opened `rb`, copied once to a newly created file in a private `TemporaryDirectory`, made read-only, then that private copy alone is hashed/mounted in Docker and kind. No source-path write occurs. Regression tests preserve external paths, `..`, source symlinks, replacement and removal without changing source bytes. Repository allowlists or forbidding `/tmp`/builder links would break the supported clean-artifact workflow without fixing a real boundary. **An authorized Sonar reviewer must record the false-positive disposition**; no taint-flow obfuscation, blanket exclusion, or remote acceptance is performed here. The trust requirement applies equally to a human- or LLM-invoked CLI: inspect/approve the selected executable rather than treating this verifier as an execution sandbox. |
| `AaFi6JH3pea8zfGF2Be8`, `python:S5779` | Replace the callback identity/role assertion with an explicit runtime verification failure. Real loopback callback tests reject wrong username, administrator role, and settings-access success, restore the original token and keep safe failure pages. The check also runs under optimized Python; the full CLI refuses optimized mode because other suites still intentionally use assertions. |
| `AaFi6JH3pea8zfGF2Be9`, `python:S5332` | Narrow expression-level `NOSONAR` for the intentional HTTP fixture below; no scheme obfuscation, fake TLS, or networking change. |
| `AaFi6JH3pea8zfGF2Be-`, `python:S5443` | Fix real report/screenshot output clobber: unique secure default, exclusive private explicit outputs, privately staged browser captures. Temp-only regressions first demonstrated symlink/hardlink overwrite and unsafe permissions. |
| `AaFi6JIRpea8zfGF2BfA`, `python:S3516` | Simplify `review()` to one return after an apply-only loop. Default preview and all-case, immediately-before-write preflights are unchanged; manual review tests retain the exact closed set. |
| `AaFgfrDLBmL4uU2_jom2`, `docker:S6471` | Toolkit root bootstrap remains intentional: create requested UID/GID/socket groups, then drop to `PUSER`. No Dockerfile, entrypoint, manifest key/hash, permission gate, or runtime identity was changed. The existing [six-case manual path](../security/sonar-root-review.md) still requires authorized credentials and live source/transition/readback checks. It does not include the CLI-read finding or any new case. |
| `AaFi6JCwpea8zfGF2Be7`, `godre:S8239` | Correct cancellable status polling, separately from intentionally detached stack teardown; see the [backend review](../../backend-src/SECURITY_REVIEWS.md). |

### Isolated Edge fixture HTTP boundary

`suite_edge()` runs an official disposable agent **inside its owned nested DinD
engine**. The URL's gateway comes from that engine's `docker network inspect
bridge`, not a caller-supplied remote deployment URL or the host's bridge. Vessel
shares the outer engine's network namespace and serves the nested agent at its
bridge gateway. Only disposable fixture Edge keys/API credentials cross that
bridge. The agent uses its nested engine's socket and volumes, not the shared
host's Docker socket; no agent port or host network is exposed. The only host API
publication remains random loopback. This local fixture is not claimed to encrypt
poll/bootstrap HTTP; the real reverse tunnel still runs normally. Switching this
URL alone to HTTPS would fail because the fixture has no TLS listener/trust setup,
not add encryption. No production transport policy or ordinary external TLS
verification is weakened. This is narrower than, and distinct from, the product's
[encrypted-tunnel inner HTTP rationale](../../backend-src/SECURITY_REVIEWS.md#loopback-edge-tunnel-http--gos5332).

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
  change. Both kind creation **and deletion** explicitly use the private kubeconfig. Anonymous engine volumes are overridden with owned named volumes.
- A failed or interrupted (Ctrl-C/SIGTERM) test still attempts cleanup. Inspect `cleanup_failures` and the
  reported exact prefix after interruption. SIGKILL/host failure cannot guarantee
  cleanup: remove only those exact recorded resources, never a global prune.
- Private temp data/config/passwords and owned subprocesses are removed/stopped.
  Report JSON and explicitly requested safe screenshots remain at their printed
  or caller-selected output paths (normally in temporary storage).

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
| Podman 5.8.1 | Actual privileged Linux Podman service using vfs; environment CRUD, running container CRUD/logs, and Compose stack create/update/delete through Vessel's Podman path (not Docker relabeled as Podman); container-local iptables fixture adapter as explained above |
| Kubernetes 1.35.0, kind 0.31.0 | Real in-cluster Vessel Pod and service-account auth; namespace CRUD; ready Deployment CRUD; Kubernetes stack/ConfigMap create/delete; environment create/delete |
| Edge agent 2.45.0 | Official agent on owned nested engine; polling, reverse tunnel, actual environment Docker info and container CRUD/logs |
| Dex 2.45.1 / Chrome / Playwright 1.58.2 | Real provider browser login; actual production Vessel frontend callback and companion callback separately passed; actual token exchange/UserInfo; invalid-state rejection before token exchange; provisioned standard user and admin-setting denial; reload restores cookie session. Original mobile check covered document width only, not drawer/button hit testing; see the stronger candidate finding below. |
| ACI | **Blocked**, no Azure CLI/account authorization; no mock substituted |

Production dependency-upgrade frontend artifact tested with the baseline backend:
build ID `owEQDO4vt6hhNfr29wLKA`, generated standalone server SHA256
`fac6973c3f5c6becd513248b8620b332ee460fe1e23b473ea04d52db5997b9cd`.
Original desktop/mobile screenshots are in `/tmp/vessel-rest-platform-frontend-oauth*.png`.
The original mobile capture was taken during/with an expanded drawer and is not
useful evidence of closed-drawer usability. It is superseded by the stronger
candidate mobile evidence below. The source artifact was read-only; only its
disposable copy was customized.

The final bounded/owned-resource baseline combined run is recorded in
`/tmp/vessel-rest-platform-base-combined.json` (six runnable suites passed, ACI
blocked, zero cleanup failures). Production frontend results are in
`/tmp/vessel-rest-platform-base-frontend-oauth.json`. The additional Podman Compose
CRUD extension passed in `/tmp/vessel-rest-platform-base-podman-compose.json`.

### Dependency-upgrade candidate (not final)

Supplied candidate: `/tmp/vessel-dep-go-candidate-linux-arm64`, independently
verified static Linux ARM64 ELF, SHA256
`c5543423d87ada7d86dd0596f57448ee215ef697b300b588448fdce08c1f83f2`.
Its runtime reports Go **1.26.6**, Git commit **46882c1d4**, Compose **5.3.1**,
Moby client **0.5.1**, Vessel **1.3.1**, and datastore **2.45.0**.
This is explicitly **candidate-only** evidence, not certification of the planned
Go 1.26.10 final artifact or unresolved advisory reconciliation.

- Combined candidate run: Docker/Compose, isolated Swarm, actual Podman/Compose,
  in-cluster Kubernetes, and official Edge passed; ACI remained blocked. All suites
  were attempted despite the OAuth/mobile failure. Results:
  `/tmp/vessel-rest-platform-candidate-combined.json`.
- Additional real Swarm SDK path passed:
  `PUT /api/endpoints/{id}/forceupdateservice` with the actual service ID and
  `PullImage:false`; `ForceUpdate` changed **0 → 1**, a replacement task reached
  running, and the real wire response's **Warnings was null**. The harness accepts
  null, empty arrays, or string arrays and rejects other shapes. It waits for the
  preceding stack rolling-update monitor to complete before this independent
  update; an earlier attempt raced that update and returned Docker's legitimate
  `update out of sequence`. Results:
  `/tmp/vessel-rest-platform-candidate-swarm-force-update.json`.
- Real Dex/production frontend OAuth callback, invalid-state rejection, identity,
  ACL, cookie-session reload, closed-drawer search/sort interactions, and actual
  keyboard drawer reopen/close passed. The strengthened **pointer** drawer-open
  check failed: at 390px the GlobalSearch trigger covers the center of the sidebar
  expand button. DOM hit testing puts `GlobalSearch_trigger` above
  `MainLayout_sidebarToggle` (button 34×34 at y=13). The failure is retained, not
  converted into a pass by keyboard fallback. Results:
  `/tmp/vessel-rest-platform-candidate-oauth.json`, including
  `oauth_browser_checks` with partial successes and the exact failed stage.
- The mobile screenshot now waits until Main navigation's bounding rectangle is
  fully offscreen after closing, then captures loaded, usable main content:
  `/tmp/vessel-rest-platform-candidate-oauth-mobile.png`. Other safe screenshots
  share the `/tmp/vessel-rest-platform-candidate-oauth` prefix.
- The header overlap was reported to the parent for baseline frontend comparison.
  **No dependency regression is asserted without before/after evidence, and no
  product/UI code was changed by this verification task.**

Neither baseline nor candidate results certify a later final artifact. The
separate final-artifact run below supersedes their runtime coverage without
rewriting the historical failures.

### Earlier exact Go 1.26.10 artifact, before round-four fixes

Fresh combined run on 2026-10-22:

- Clean backend implementation source
  `030beb74fed2951e3552235135c2e01545cb6df8`; ARM64 SHA256
  `37b916219eebb167ee14f4ff9a5f638bd0c0b1962159f846d728bd6d6c83e320`.
  Before documentation-only updates, the integrated parent backend tree matched
  this artifact's source tree exactly. The runtime confirms Go **1.26.10**,
  Vessel **1.3.1**, API/datastore **2.45.0**, Compose **5.3.1** and SDK **0.5.1**.
- Integrated production frontend build ID `79qONiyWoTz44XGPmvyya`; standalone
  server SHA256
  `ca9e62a794f3268b9846ed2bf785e86f4e293c2493350aca2f9a388d8035c103`.
  It includes the real responsive-header fix and nullable generated response
  contract. Its source artifact remained unchanged; only the disposable copy's
  API rewrite was changed.
- Actual report `/tmp/vessel-rest-final-platforms.json`; raw exit **2** because
  explicitly requested ACI is access-gated. All six runnable suites **passed**;
  cleanup failures are **zero**. No access-gated suite is counted as a pass.

| Surface | Final-artifact result |
| --- | --- |
| Docker / Compose | Real environment/container CRUD and logs; Compose create/update/delete pass |
| Nested Swarm | Stack/container/environment CRUD and actual force update pass; `ForceUpdate` changes 0 → 1 and a replacement task runs; wire `Warnings` is null |
| Linux Podman / Compose | Actual Podman service/container CRUD/logs and Compose create/update/delete pass, with only the documented container-local firewall adapter |
| kind Kubernetes | Real in-cluster service-account access, namespace/ready Deployment CRUD and application paths pass |
| Official Edge agent | Real polling, reverse tunnel and container CRUD/logs pass |
| Real Dex / production frontend | Invalid-state rejection, actual provider callback/token exchange/UserInfo, standard-user ACL, cookie-session reload, search/sort and natural mobile drawer pointer open/reopen/close pass |
| ACI | **Not done yet:** authorized Azure access is unavailable; no resource created |

The exact owned resource prefix has no remaining containers, networks or volumes;
the shared host's Swarm state remains **inactive**. Safe application-only captures
are `/tmp/vessel-rest-final-oauth.png` and
`/tmp/vessel-rest-final-oauth-mobile.png`. The separate
[56-case header matrix](../security/mobile-header-verification.md) provides broader
responsive geometry coverage; it is not relabeled as final-backend coverage or a
real Business Edition deployment.

A separate **emulated Linux AMD64** run executes the clean final backend, not
just its toolchain: SHA256
`ee5011f6e801537427c2467a1d31e963cccc54bfd434c113a1e48b6e9425855a`,
same source `030beb74f`, with local `vessel-rest-toolkit:amd64`. Actual
Docker/container/log and Compose create/update/delete checks pass; runtime
metadata confirms Go 1.26.10 and the exact source. Report:
`/tmp/vessel-rest-final-amd64-docker.json`; raw exit **0**, zero cleanup failures.
This is real backend/API execution under Docker Desktop's emulation, **not native
AMD64 hardware coverage** and not a second all-platform-suite claim. Both toolkit
architectures were also built and executed with real UID/GID 1000 and writable
home checks; no image was published.

These results do not clear the five remaining selected Go advisory ranges or
provide Sonar review authorization, Azure/Authentik accounts, or Windows/npipe
runtime execution. Those limits remain explicit in the security records. Future
implementation changes require a new fingerprinted artifact run, not reuse of
this result.

Harness-only checks (no live resources required):

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s scripts/integration -p 'test_*.py' -v
node --check scripts/integration/oauth_browser.cjs
git diff --check
```

Thirty safety/transport unit tests passed during implementation. These verify
resource ownership/bounds/cleanup, artifact identity, transport behavior, transient
startup retries, explicit Azure access gates, and credential-safe failure reports.
Unexpected HTTP responses never export response bodies or query values, including
an unexpected successful settings response during an ACL check. These unit tests
are not counted as live platform coverage.

### Scoped expanded-remediation follow-up (2026-10-22)

Failing-first temp-only tests demonstrated the real report/screenshot clobber and
output-permission defects before their fixes. The non-ELF-selection regression
also failed first, then verified that a rejected synthetic secret/data input is
not copied and only its own private snapshot directory is removed.

A fresh official `python:3.14-slim` run reproduced the existing self-cycle guard
regression (43 tests, one failure) before the portable strict-resolution fix.
The fixture mounted scripts read-only, had no network or host socket, used a
read-only root plus temporary tmpfs, and had bounded memory/CPU. This is not a
Python-version pin to avoid the failing case. The internal-dangling-package-link
regression preserves the legitimate nonstrict missing-target case without
falling back for `ELOOP` or other resolution errors. Host Python 3.9.6 and the
same bounded official Python 3.14 container both pass all 44 focused
safety/transport tests after the fixes, including actual companion
callback HTTP requests, optimized-Python safety checks and a further failing-first
regression ensuring interrupted unique reports remain retained and discoverable
via the printed output path. The manual-review
suite passes 19 tests and issue-sync passes 28; Node 24.22.1 browser-companion
syntax and whitespace checks pass. Harness HTTP-error responses are explicitly
closed; the final integration-safety Python 3.14 run emits no ResourceWarnings.
The official test image digest is
`sha256:0514bc76712d64f8bb48adcb95b1ab0d88c69fee95d62fe4c18ee948bee9b1e1`.

The new Go polling tests also failed first against the old implementation:
in-flight `Ps` ignored cancellation, the caller's earlier deadline was not
inherited, and the polling delay both delayed cancellation and started `Ps`
after cancellation. The fix uses the original caller context, not the detached
`WithCli` callback context, and makes the delay interruptible. Deployment and
teardown detachment remain unchanged. Both affected packages pass normal and race
checks with Go 1.26.10 (integration opt-ins remain disabled):

```sh
# From backend-src:
GOTOOLCHAIN=go1.26.10 GOSUMDB=sum.golang.org \
  go test -p 3 -count 1 -timeout 90s ./pkg/libstack/compose ./pkg/libstack
GOTOOLCHAIN=go1.26.10 GOSUMDB=sum.golang.org \
  go test -race -p 3 -count 1 -timeout 180s ./pkg/libstack/compose ./pkg/libstack
```

These harness/unit checks alone did **not** certify a new backend binary or
production frontend run. The separate exact-artifact repeat below supplies that
later evidence; the earlier `030beb74f` integration record remains historical.
Use fresh report/screenshot paths because explicit outputs are now create-only.
Authorized Sonar recording remains operator-owned, not an implied outcome of
local source remediation.

### Post-review exact-artifact repeat (2026-10-22)

Clean parent implementation source `61c04c69338b3bcea37c74579c2d506e646197d1`
includes legacy version-field capture, missing-only predefined-role initialization,
caller-cancelled Compose polling and the other round-four fixes. It was built with
Go 1.26.10 using the actual packaging script, no dependency mutation, and clean
VCS metadata. The subsequent JWT timing correction changes tests only, not this
artifact's product implementation.

| Artifact | SHA256 |
| --- | --- |
| Linux ARM64 | `d2d2a8e13a102c4cc24fd26e3649d4bca8115001704cbf4c638183467f0081ca` |
| Linux AMD64 | `48abed33301ea32dc2574acb1c522862a87bc97937da462bee55833f15418d54` |

Frontend build **`22JZOmL_MM9jkH2reT29j`** includes the hover-alpha and width-only
border compatibility corrections. The standalone server file has SHA256
`ca9e62a794f3268b9846ed2bf785e86f4e293c2493350aca2f9a388d8035c103`;
this generated server file alone is not a fingerprint of every frontend asset,
so retain the build ID and source checkpoint as well.

- `/tmp/vessel-rest-r4-platforms.json`: **all six runnable suites pass again**:
  Docker/Compose, nested Swarm/actual force update, Linux Podman/Compose, real
  in-cluster kind Kubernetes, official Edge, and Dex/production-frontend callback,
  identity/ACL/session/mobile pointer behavior. Requested ACI remains **blocked**;
  raw exit **2**, zero cleanup failures. This run uses the patched toolkit runtime
  and the corrected Python verifier, including its real standalone symlink guard.
- `/tmp/vessel-rest-r4-amd64-docker.json`: final **AMD64 backend actually executes**
  Docker/container/log and Compose CRUD; raw exit **0**, zero cleanup failures.
  This is explicit Docker Desktop emulation, not native AMD64 hardware or a
  second all-platform-suite claim.
- `/tmp/vessel-rest-r4-role-ui.json`: actual fresh startup exposes five predefined
  roles and **130** editor permissions. Playwright creates a custom role at
  reserved-safe **ID 6**, checks both width-only components in light/dark/high-
  contrast cases, and reports no page errors or cleanup failures. The sidebar
  update flag is supplied as an explicitly synthetic browser response to exercise
  that conditional presentation; this does not test a real external update feed.
  Safe final capture: `/tmp/vessel-rest-r4-role-editor.png`.

The current parent also passes all **210 Go packages**, race checks across all
**41 changed Go package directories**, all **47 Sonar + 44 platform** Python tests
on host 3.9.6 and actual Python 3.14, full frontend/tooling/build checks, and
byte-identical regeneration of all **18** backend/frontend schema/client files.
The fresh-database role fix has separate persistence/access-policy regressions;
this live run does not substitute for those tests.

Sonar's completed `cde139e4f` analysis retains only the intentional toolkit-root
case and S8707's false HTTP-taint attribution to an explicit trusted CLI read.
Both whole-scope reviewers independently checked that input boundary. Same-stream
ELF validation prevents accidental nonbinary selection but is not described as a
path-confinement fix. Authorized review is still needed; no remote finding was
accepted or dismissed. Five selected Go ranges and ACI/native Windows access
limits remain explicit. The separate [local Authentik provider record](../security/authentik-local-verification.md)
passes all four real browser/code/UserInfo/membership phases on this same exact
backend, with no OOM or cleanup failures. It uses a companion callback, not the
production frontend; the Dex frontend result is not relabeled as Authentik
frontend or external-policy coverage.
