# Backend dependency security remediation

## Status (not a zero-alert claim)

This change remediates **21 of the 26 Go alerts** in the supplied open-alert snapshot. **Five no-patch alerts remain in selected transitive modules**. They are not dismissed, ignored, aliased, or represented as fixed because their daemon/client entry points are not linked. The release identity and API/datastore compatibility baseline remain unchanged.

The application's direct Docker API/client imports now use the actual upstream modules `github.com/moby/moby/api v1.55.0` and `github.com/moby/moby/client v0.5.1`. Compose migrates from v2.40.3 to v5.3.1 and Docker CLI to v29.6.1. This is a source/API migration, not a `replace` of the vulnerable monolith with a different module identity. Registry auth serialization, resource-control lookups, Swarm filters/spec versions, container recreation/rollback, snapshots, diagnostics, and detached Compose contexts have been adapted.

## Inventory of all 26 supplied alerts

Numbers are repository Dependabot alert numbers. GHSA links identify the full advisory consulted. Selected versions are from fresh `go list -m all`, not just direct `require` lines.

| Alert | Module | Advisory | Selected version / disposition |
| --- | --- | --- | --- |
| 1 | `github.com/docker/cli` | [GHSA-p436-gjf2-799p](https://github.com/advisories/GHSA-p436-gjf2-799p) | v29.6.1; patched >=29.2.0 |
| 2 | `github.com/moby/buildkit` | [GHSA-4c29-8rgm-jvjj](https://github.com/advisories/GHSA-4c29-8rgm-jvjj) | v0.31.1; patched >=0.28.1 |
| 3 | `github.com/moby/buildkit` | [GHSA-4vrq-3vrq-g6gg](https://github.com/advisories/GHSA-4vrq-3vrq-g6gg) | v0.31.1; patched >=0.28.1 |
| 4 | `github.com/docker/docker` | [GHSA-pxq6-2prw-chj9](https://github.com/advisories/GHSA-pxq6-2prw-chj9) | **Unresolved**, v28.5.2; vulnerable <29.3.1, no patched monolith release |
| 5 | `github.com/docker/docker` | [GHSA-x86f-5xw2-fm2r](https://github.com/advisories/GHSA-x86f-5xw2-fm2r) | **Unresolved**, v28.5.2; vulnerable <=28.5.2, no patched monolith release |
| 6 | `github.com/docker/docker` | [GHSA-vp62-88p7-qqf5](https://github.com/advisories/GHSA-vp62-88p7-qqf5) | **Unresolved**, v28.5.2; vulnerable <=28.5.2, no patched monolith release |
| 7 | `github.com/docker/docker` | [GHSA-rg2x-37c3-w2rh](https://github.com/advisories/GHSA-rg2x-37c3-w2rh) | **Unresolved**, v28.5.2; vulnerable <=28.5.2, no patched monolith release |
| 8 | `github.com/moby/go-archive` | [GHSA-hfg8-hc9c-6c3h](https://github.com/advisories/GHSA-hfg8-hc9c-6c3h) | v0.3.3; patched >=0.3.0 |
| 9 | `github.com/moby/buildkit` | [GHSA-7236-3392-c5c6](https://github.com/advisories/GHSA-7236-3392-c5c6) | v0.31.1; patched >=0.31.1 |
| 10 | `github.com/moby/buildkit` | [GHSA-72x6-4j93-7w86](https://github.com/advisories/GHSA-72x6-4j93-7w86) | v0.31.1; patched >=0.31.1 |
| 11 | `google.golang.org/grpc` | [GHSA-vp52-pcj8-j9qc](https://github.com/advisories/GHSA-vp52-pcj8-j9qc) | v1.83.2; patched >=1.83.1 |
| 12 | `google.golang.org/grpc` | [GHSA-qc2q-p7wx-3px3](https://github.com/advisories/GHSA-qc2q-p7wx-3px3) | v1.83.2; patched >=1.83.1 |
| 13 | `google.golang.org/grpc` | [GHSA-2v4p-qf9q-27wj](https://github.com/advisories/GHSA-2v4p-qf9q-27wj) | v1.83.2, including the 1.83-branch missing-authority fix |
| 14 | `github.com/containerd/containerd` | [GHSA-7jxh-36q5-gcqv](https://github.com/advisories/GHSA-7jxh-36q5-gcqv) | **Removed**; standalone `github.com/containerd/errdefs` replaces the only application import |
| 15 | `github.com/containerd/containerd/v2` | [GHSA-7jxh-36q5-gcqv](https://github.com/advisories/GHSA-7jxh-36q5-gcqv) | v2.2.9; patched >=2.2.8 |
| 16 | `go.opentelemetry.io/otel/sdk` | [GHSA-8wmf-6v46-5gfg](https://github.com/advisories/GHSA-8wmf-6v46-5gfg) | v1.45.0; patched >=1.45.0 |
| 17 | `go.opentelemetry.io/otel/exporters/otlp/otlptrace` | [GHSA-8wmf-6v46-5gfg](https://github.com/advisories/GHSA-8wmf-6v46-5gfg) | v1.45.0; patched >=1.45.0 |
| 18 | `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc` | [GHSA-8wmf-6v46-5gfg](https://github.com/advisories/GHSA-8wmf-6v46-5gfg) | v1.45.0; patched >=1.45.0 |
| 19 | `go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp` | [GHSA-8wmf-6v46-5gfg](https://github.com/advisories/GHSA-8wmf-6v46-5gfg) | v1.45.0; patched >=1.45.0 |
| 20 | `github.com/containerd/containerd` | [GHSA-pg57-6jwg-q645](https://github.com/advisories/GHSA-pg57-6jwg-q645) | **Removed** |
| 21 | `github.com/containerd/containerd/v2` | [GHSA-pg57-6jwg-q645](https://github.com/advisories/GHSA-pg57-6jwg-q645) | v2.2.9; patched >=2.2.9 |
| 22 | `github.com/moby/sys/user` | [GHSA-mjcv-p78q-w5fw](https://github.com/advisories/GHSA-mjcv-p78q-w5fw) | v0.4.1; patched >=0.4.1 |
| 23 | `github.com/containerd/containerd/v2` | [GHSA-p7v4-vr35-mj6f](https://github.com/advisories/GHSA-p7v4-vr35-mj6f) | v2.2.9; patched >=2.2.7 |
| 24 | `github.com/docker/distribution` | [GHSA-685w-q87j-wqw3](https://github.com/advisories/GHSA-685w-q87j-wqw3) | **Unresolved**, v2.8.3; vulnerable <=2.8.3, no patched v2 release |
| 25 | `github.com/containerd/containerd` | [GHSA-rp3h-jf77-q9p4](https://github.com/advisories/GHSA-rp3h-jf77-q9p4) | **Removed** |
| 26 | `github.com/containerd/containerd/v2` | [GHSA-rp3h-jf77-q9p4](https://github.com/advisories/GHSA-rp3h-jf77-q9p4) | v2.2.9; patched >=2.2.8 |

## Exact remaining dependencies and real removal options

Fresh package-import graph (`go list -deps`) has these old-module paths:

```text
pkg/libstack/compose
  -> docker/compose/v5/pkg/compose
  -> docker/buildx/store/storeutil -> docker/buildx/store
  -> docker/docker/pkg/namesgenerator

api/docker/images
  -> go.podman.io/image/v5/docker -> go.podman.io/image/v5/manifest
  -> docker/docker/api/types/versions

api/docker/images
  -> go.podman.io/image/v5/docker
  -> docker/distribution/registry/api/errcode
  -> docker/distribution/registry/api/v2 (also directly imported by that helper)
```

These are the only linked packages from the two old modules in the fresh main-package dependency graph. No application source imports the monolith directly anymore. That **does not** remove its selected vulnerable version or clear its advisory range. It also does not establish safety of a remotely managed daemon. In particular, the registry advisory concerns `manifests.Get()` body-vs-requested-digest verification, not merely the `Docker-Content-Digest` response header.

The raw module graph additionally retains these requirements:

- Compose5.3.1 -> Docker28.5.2; Buildx0.35.0 -> Docker28.5.2 and Distribution2.8.3.
- Podman image5.37.0 -> Docker28.3.3 and Distribution2.8.3.
- Prometheus0.311.3 -> Docker28.5.2.
- Kompose1.37.0 -> Docker27.1.2. Its fsouza client is legitimately upgraded to1.13.3 (split SDK), but its upstream indirect requirement still exists.

Upstream alternatives were actually inspected, not assumed:

1. Buildx0.38.1 and master `a9bcf45d2a7c1a80417c3858618a34c4396fe02d` still import the old monolith's `pkg/namesgenerator`. Merely upgrading Buildx does not remove it.
2. **Compose5.5.1 removes the Buildx Go dependency** and needs only Go1.26.3. A trial upgrade exposed a real compatibility blocker: it requires containerd2.3.4, which raises Kubernetes modules to0.36.3. Both Kompose1.38.0 and current main `59af0f0e641e3a4e4b4c7696dc65acf5c8c8df77` still import removed `k8s.io/api/autoscaling/v2beta2`. Current kubectl0.35 also imports removed `k8s.io/api/scheduling/v1alpha1`. `go mod tidy` fails with these missing packages. The trial was reverted rather than forcing a lower containerd version with `replace`, dropping Kompose, or shipping a non-compiling graph. A legitimate route is an upstream Kompose source migration to `autoscaling/v2`, a coordinated Kubernetes/kubectl upgrade, and then Compose5.5.1 or newer. Latest Compose5.6.1 additionally requires Go1.26.8.
3. Podman image5.42.0 uses the split Docker SDK, but **still imports Distribution2.8.3 error-code APIs**. Updating that module alone cannot clear alert24. A real removal route is to migrate Vessel's registry digest/reference helper to the already-used ORAS OCI client and `distribution/reference`, with regression coverage for Basic/Bearer auth, Docker Hub anonymous fallback, HEAD/GET fallback, digest integrity, TLS/insecure registry settings, and any relied-upon containers-auth/registries.conf behavior. This must not be confused with dropping Podman engine support: Podman endpoint management uses the Docker-compatible API independently. No incomplete helper replacement was shipped.
4. Latest Docker CLI29.9.2 and master `6d274590f2f63276a54da8adf475a455d21c1fdd` still contain Distribution v2 registry-client imports; latest Distribution v2 is2.8.3. The maintained `github.com/distribution/distribution/v3 v3.1.2` no longer provides the old `registry/client` package. Aliasing the v2 module path to v3 is not an API migration or a valid fix. All live imports and upstream requirements must be migrated or removed instead.
5. Prometheus0.315.1 no longer requires the monolith, but also raises Kubernetes modules (to0.37 in the trial). Kompose's same removed-HPA-API incompatibility must be resolved first. The trial was reverted.

## SDK migration verification (Go1.26.6 checkpoint)

All commands ran locally; no GitHub/Sonar state, image publication, remote branches, or host Swarm state was modified.

- `GOTOOLCHAIN=local go test -p 4 -count=1 -timeout 90s ./...`: **PASS, 210 packages** on Go1.26.6/darwin-arm64.
- `go test -race -p 3 -count=1 -timeout 120s` on all23 implementation-affected packages: **PASS**. The first run exposed two existing test-only races polling mutable fake-deployer fields. Those tests now join deployment completion before reading the fields; the rerun passes without suppressing the detector.
- At this initial SDK checkpoint, protocol tests pinned API1.40,1.41 and1.54. Split SDK0.5.1's hard automatic negotiation floor1.40 exposed a compatibility regression for older endpoints; this checkpoint did not prove pre-1.40 compatibility. The subsequent public-probe adapter and its failing-first/baseline comparisons are documented below.
- Detached Compose regression tests prove cancelled caller contexts do not cancel Build/Up/Down and caller values survive. Constructor errors are propagated. Compose's default bind `create_host_path=true` now serializes as omitted/default (`bind: {}`), not a behavior change.
- Real isolated Docker engine29.8.2, negotiated API1.55: **PASS** for registry pull, Compose validate/deploy, network and named-volume attachment, one-off run, and full teardown with already-cancelled caller contexts. `TestDependencyRuntimeSmoke` requires `VESSEL_DEPENDENCY_DOCKER_HOST` explicitly; it does not target the developer's default Docker context.
- The existing Swarm integration tests `TestSwarmDeployWithRemoveOrphans` and `TestSwarmDeployWithEnvVars`: **PASS** on that disposable dind. Only that engine was initialized as a Swarm and torn down.
- Real Podman service and broader Kubernetes/platform testing are delegated to the parent's isolated platform harness; protocol mocks are not described as real Podman coverage.
- Linux ARM64 and AMD64 CGO-disabled backend builds: **PASS**. Parent packaging owns linker-metadata query changes for the split SDK/Compose module paths.
- Checked all Docker SDK types in Swagger annotations and regenerated both backend schemas with Swag1.16.6, swagger2openapi7.0.8 and swagger-cli4.0.4 (Node24.21.0/pnpm10.26.2). Repeated generation is byte-identical and the OpenAPI validator passes. Real generation also refreshes existing status-branding and websocket-pod annotation drift; no generated schema was hand-edited. Frontend contracts/checks belong to the parent after integration; older-schema npm verification is not reused as evidence for this schema.
- Service force-update uses an owned response DTO with explicit `x-nullable` warnings (OpenAPI `nullable: true`). Regression tests compare this DTO with both the SDK result and previous API DTO, preserving nil `Warnings` as null, empty warnings as [], and populated warnings. The annotation resolves to this actual serialized DTO; nullability is not inferred from SDK types.
- `go mod tidy`, raw comparison of all26 supplied advisory ranges against selected modules, and `git diff --check`: completed. Range comparison reports **21 fixed/removed; five unresolved**, as above.

## Additional vulnerability findings at the Go1.26.6 checkpoint

`govulncheck v1.9.0 -format=json ./...` completed; JSON-mode exit0 is **not** a clean-scan verdict. Its fresh database reports16 advisory IDs with symbol-level traces:14 in Go1.26.6's standard library and2 old-monolith advisories (GO-2026-4883 and GO-2026-4887). Monolith traces pass through `namesgenerator.init`, not a demonstrated call to vulnerable daemon plugin handlers; the selected vulnerable module is nevertheless still present and not counted as remediated. Module-level findings also include the unmaintained `x/crypto/openpgp` advisory; no clean bill of health is asserted from absence of a symbol trace.

The scan also found and this change patches `x/net` to0.60.0, `x/crypto` to0.57.0 and `x/mod` to0.41.0 (including SSH DoS and sumdb integrity fixes), beyond the supplied26 alerts.

The standard-library fixes require a real Go security patch update: most are fixed in1.26.9; **GO-2026-6809 (`crypto/x509`, compromised intermediate distrust) requires1.26.10**. The maintainer approved Go1.26.10. The current `go.mod`, workspace, developer-toolkit image, build fixture and setup documentation now use that security baseline. The Go1.26.6 results above remain historical checkpoint evidence, not claims about the patched-toolchain verification.

The official Go1.26.10 darwin-arm64 archive was downloaded outside the repository and verified against SHA256 `0b5183492292ada170f9b561a834863808dd02edba599e4ad0e89899330020b3`; the shared system Go installation was not modified. The toolkit uses the freshly inspected multi-platform `golang:1.26.10-bookworm` index digest `sha256:632dff7351799a5a9954a48dc06670ade72ee44e8c351cdc0e5a57af2fea21af`. Parent-owned CI/Sonar pins and historical release notes are not rewritten.

## Patched graph checkpoint (Go1.26.10, before the slow/recovered-engine correction)

- Full `go test -p 3 -count=1 -timeout 90s ./...`: **PASS, 210 packages** after the legacy-negotiation implementation. Affected23-package race run: **PASS**. The final added TLS protocol test also passes in a fresh race run of the client package.
- Fresh govulncheck on the patched baseline reports **zero standard-library symbol-level advisory IDs** (all14 prior stdlib findings removed). The two old-monolith advisory IDs still have init traces, and the same five original raw module ranges remain unresolved. This is not a clean overall scan or 26-alert completion claim.
- Nullable response schemas regenerate byte-identically and validate. The owned wire DTO preserves nil/null, empty[] and populated warnings; its explicit nullability replaces the SDK-only schema that omitted nullability. Blank/whitespace-only ServiceID is rejected as400 before datastore/auth/SDK calls; valid nonblank names and IDs are not rewritten or syntax-restricted. Validation and HTTP tests were run failing-first, then pass under race.

### Initial legacy Docker negotiation adapter (superseded)

An isolated executable using the actual previous Docker28.5.2 client/factory options confirmed successful negotiation and HTTP paths for API1.24,1.39 and1.41. New factory tests for1.24 and1.39 failed before the compatibility change. No documented repository minimum was found that would justify dropping these endpoints.

The factory now performs a public SDK `Ping` before exposing a client to concurrent callers. Modern APIs retain normal SDK negotiation. For a legacy advertised version below1.40, it constructs a fresh client using the SDK's public `WithAPIVersion`; an absent API header retains the previous SDK's1.24 fallback. It does not spoof server headers, rewrite request paths, use reflection, copy old SDK code, or mutate private client state. An unused1.37 constant was not the old factory's actual negotiated minimum and has been removed.

This intentionally moves the initial ping from first operation to construction. The probe is bounded to5seconds or the smaller positive requested timeout; connectivity/auth errors still leave error reporting to the operation's own context, preserving constructor error behavior. Each reconstructed client gets its own HTTP-client value to avoid stacking tracing wrappers on a shared value. Protocol/race coverage includes TCP1.24/1.39/1.40/1.41/1.54, missing-header1.24 fallback, legacy signed agent headers+inspect, Unix1.24, TLS1.39, and short probe timeout/cancelled operation context. This proves those protocol operations, not every feature on an actual2016 engine. Real Podman1.41 and combined platform checks remain the parent's runtime harness responsibility.

### Slow/recovered-engine correction (current implementation)

The initial five-second probe was not compatible with the former factory. An independent real-loopback reproduction using **both actual SDK implementations** advertised API1.39, delayed only the first `/_ping` by5.2s, and requested a20s HTTP timeout. Before this correction the new factory failed `/v1.55/info` after5.003s; the previous SDK negotiated1.39 and succeeded after5.201s. After this correction the same executable succeeds with1.39 in5.207s (previous SDK5.203s). A failed initial probe must not expose a usable client at the default API version.

The corrected factory uses only public SDK `Ping` and `WithAPIVersion` APIs. It pings **without** asking the SDK to mutate negotiation state, validates the advertised version via `WithAPIVersion`, and constructs a fixed-version client before exposing it. Missing headers retain the old1.24 fallback; versions above the SDK maximum are capped at1.55. Modern1.54, legacy1.24/1.39, and Podman-compatible1.41 are not silently raised to a new minimum. There is no spoofed response header, rewritten request path, copied old SDK, reflection, unsafe mutation, or transport-level version interception.

The probe uses the configured HTTP timeout (default60s, an explicit positive override, or unlimited when0), not an unrelated5s cutoff. Its **whole negotiation**, including one recovery retry of a failed SDK Ping, is bounded by that budget and the caller's earlier cancellation/deadline. Each SDK Ping already has HEAD/GET fallback; the recovery regression fails **both** methods of the first probe. A failed/cancelled negotiation returns an error and **nil client**, never an unnegotiated client. After a failed construction the next construction may retry a recovered endpoint. An unreachable endpoint does not loop indefinitely: there are at most two SDK Ping calls. Local Unix/npipe transports retain SDK transport configuration and use the caller context plus the same default60s (or explicit override) negotiation budget. Although their former lazy SDK operations had no default HTTP timeout, eager construction must not acquire an unlimited default network wait; the explicit0 override remains caller-controlled.

**Explicit construction tradeoff:** the old SDK had truly lazy construction. That cannot be preserved together with pre1.40 negotiation while still returning its replacement's concrete `*client.Client`: split SDK0.5.1's `negotiateAPIVersion` rejects <1.40, and its public version option is a constructor option, not a safe mutable-client setter. Returning a fresh unnegotiated client after a failed probe merely re-enters that hard floor. An owned lazy facade would require replacing concrete SDK types/interfaces throughout consumers and delegating all used SDK methods; transport/header rewriting or private-state mutation are not acceptable alternatives. This bounded correction retains **eager** construction from the initial adapter, but now reports network/auth/version errors at construction and does not return a poisoned client. All production callers check constructor errors; container image-status now returns on that error instead of dereferencing nil, and service image-status propagates that error instead of losing it as `(Error, nil)`. Failing-first tests cover unavailable-engine, cancellation and deadline errors for both image-status paths and pass under race. `CreateClientWithContext` threads existing HTTP request/deployment/image-operation contexts into negotiation. Existing stack-name, volume-resource-ID, webhook, snapshot and postinit helpers that already performed their operations with background contexts retain those semantics and the `CreateClient` compatibility entry point. Their old background-operation design is not classified as a new cancellation regression. Initial construction nevertheless has the same default60s budget even over Unix/npipe; it must not introduce an unlimited default eager network wait. No caller context is retained in the returned client; later operations still use their own contexts. Detached Compose execution remains detached as before.

Failing-first real-HTTP tests demonstrate the prior failures for slow1.24/1.39 and recovered1.24/1.39 engines; modern1.54 also proves the first valid slow response must not be cut off. The corrected tests and existing TCP/TLS/agent/Unix protocol tests pass under the race detector on Go1.26.10. Additional real-HTTP tests cover first-probe recovery at1.41/1.54, concurrent operations on one negotiated client, malformed versions, max-version capping, short HTTP timeout, cancellation during construction with HTTP timeout0, and cancellation after successful construction. These are SDK/HTTP compatibility tests, not claims of live ancient-daemon feature coverage.

### Final bounded current-graph verification (Go1.26.10)

Implementation source: `030beb74fed2951e3552235135c2e01545cb6df8`, built from a clean tree. The following are fresh results for that source, not reused Go1.26.6 or initial-adapter evidence:

- All23 implementation-affected packages pass `go test -mod=readonly -race -p 3 -count=1 -timeout 120s` (19 packages with tests, four without test files). Final client/image regressions also pass in a separate fresh race run. `go mod tidy -diff` and whitespace checks pass without changing module files.
- Two independent backend schema generations using Go1.26.10/Swag1.16.6 and swagger2openapi7.0.8 are byte-identical to each other **and** the committed schemas. Swagger SHA256: `d1b0c18179000cfcfbcbe73acb43d53016b1249347ddc6bca42118ef51fa48aa`; OpenAPI SHA256: `c777692be910f6420163c770c85e74886653a1727305e87886793e292ea6807e`. Both validate through the parent's canonical maintained OpenAPI validator, not the retired external swagger-cli4 validator. Frontend contracts were not edited or regenerated in this continuation.
- Fresh govulncheck1.9.0 source/symbol scan on Go1.26.10 has **14 finding records across six advisory IDs, zero standard-library finding records**. GO-2026-4883 and GO-2026-4887 have old-monolith init traces through both `pkg/namesgenerator` and `api/types/versions`; these are not demonstrated calls to the vulnerable daemon handlers. GO-2026-5617, GO-2026-5668 and GO-2026-5746 are old-Docker module-only findings. GO-2026-5932 is the additional `x/crypto/openpgp` module-only finding. This is **not a clean scan**; JSON-mode exit0 is not used as the verdict. Component/symbol reachability does not remove any selected vulnerable module or advisory range.
- Fresh selected-module comparison against all26 supplied Go alert ranges remains **21 fixed/removed and five unresolved**: alerts4–7 (`github.com/docker/docker v28.5.2+incompatible`) and24 (`github.com/docker/distribution v2.8.3+incompatible`). No advisory is excluded or suppressed.
- Both CGO-disabled Linux candidates are static ELF binaries, with `vcs.modified=false` and the exact source above stamped in Go buildinfo and application metadata. Release1.3.1 and API/datastore2.45.0 are unchanged. Build number is `local-dependency-security-030beb74f`; dependencies report SDK0.5.1, Compose5.3.1, kubectl1.35.1 and Helm4.1.4. Frontend tool metadata explicitly says `not-built`, because this job builds only the backend. These are local candidates, **not published images or releases**.

| Local candidate (ephemeral path) | SHA256 |
| --- | --- |
| `/tmp/vessel-dep-go-030beb74f-linux-arm64` | `37b916219eebb167ee14f4ff9a5f638bd0c0b1962159f846d728bd6d6c83e320` |
| `/tmp/vessel-dep-go-030beb74f-linux-amd64` | `ee5011f6e801537427c2467a1d31e963cccc54bfd434c113a1e48b6e9425855a` |

The parent independently reports a210-package full suite, all changed-package race tests and six runnable combined platform suites passing for the preceding07d candidate; ACI returned its explicit access-gate exit2, not a pass. Those results are not relabeled as030beb runtime coverage. The parent owns the final030beb combined live/full-suite repeat and global verification documentation. Windows/npipe runtime execution is unavailable in this Darwin/Linux testing; the SDK's public npipe transport configuration is retained.

### Legacy `/version` snapshot diagnostics correction (Go1.26.10)

Implementation source: `a29fd2710` (following failing-first test commit `010adb197`). This is a focused compatibility correction, not a new dependency/security-remediation count or a replacement for the whole-application/platform verification above.

The actual previous Docker28.5.2 SDK, against a real loopback HTTP engine advertising API1.24 with **no `Components`**, preserved top-level `GitCommit`, `GoVersion`, `KernelVersion` and `BuildTime`. The split SDK0.5.1 decodes that response successfully but omits all four from `ServerVersionResult`; deriving diagnostics only from Engine component details therefore lost existing snapshot/datastore fields. The supplied old/new-SDK reproducer was rerun before the fix and reproduced all four empty values. New permanent real-HTTP snapshot tests for API1.24 and1.39 failed before implementation (first missing assertion: `GitCommit`).

Factory clients now install the SDK's public `WithResponseHook`. For the snapshot's requested `/version` call only, it wraps the body with a request-context-scoped bounded tee; the hook itself **does not read or close** the body. The SDK retains ownership of request creation, authentication, TLS, API negotiation, JSON decoding/errors, draining and closing. Only four diagnostic fields are recovered into the existing owned `DockerVersion`; the existing modern Engine-component mapping and Podman classification remain unchanged. No extra request, response status/header/API-version alteration, version-path rewrite, old-SDK copy, private-state access, transport replacement or shared per-client mutable metadata was introduced. The diagnostic copy is limited to1MiB; larger bodies still reach the SDK unchanged and retain normal SDK/component results, even when the optional diagnostic copy cannot be decoded. Ordinary SDK calls and unrelated routes are not captured. Unix/npipe SDK transport configuration and existing TCP/TLS/agent/Edge/image-response observation remain in place.

Fresh verification for this correction:

- `GOTOOLCHAIN=go1.26.10 GOSUMDB=sum.golang.org go test -mod=readonly -race -p 3 -count=1 -timeout 120s ./api/docker/... ./pkg/snapshot`: **PASS**, five tested packages plus one package without tests. This includes the existing negotiated API1.24/1.39/1.40/1.41/1.54 and slow/recovered-engine regressions, plus new all-four-field legacy snapshot, modern Engine, Podman classification/error, signed TLS agent, Edge tunnel/image observation, Unix metadata, cancellation, concurrent captured/ordinary requests, bounded-copy, unchanged-body/header/status and SDK-result/error comparisons (including a nonstandard201 success accepted by the SDK). The first expanded run exposed a test-fixture ordering problem: process-wide FIPS initialization lived inside one parallel test. Initialization now occurs before any tests run; no production FIPS behavior changed. The fresh rerun passes.
- Focused new version/Unix tests additionally pass **five consecutive runs under `-race`** (`-count=5`, same toolchain and readonly module mode).
- An off-repository executable imports **both actual old and new SDK implementations** and runs full snapshots via the current product factory against the same component-less loopback responses. All four values match at advertised API1.24,1.39,1.41 and1.54: `78d1802`, `go1.6.4`, `4.4.0`, `2017-01-10T20:40:42.445Z`. Negotiation remains1.24/1.39/1.41 respectively; at advertised1.54 the old SDK naturally caps at its1.51 maximum and the new client uses1.54. The after-fix comparison intentionally uses the real product factory: response hooks are constructor options and cannot be attached to an already-created bare SDK client. All production snapshot clients use that factory.
- `go mod tidy -diff` and `git diff --check`: **PASS**, with no module-file changes. No Go Swagger annotations or wire DTO definitions changed, so no generated schema/client edits or regeneration were needed. Release1.3.1, API/datastore2.45.0, Go1.26.10, Node24 and pnpm10.26.2 remain unchanged.

Ephemeral evidence: `/tmp/vessel-legacy-version-before-repro.log`, `/tmp/vessel-legacy-version-failing-first.log`, `/tmp/vessel-legacy-version-fixed-first.log`, `/tmp/vessel-legacy-version-sdk-proof.go` and its `.log`, `/tmp/vessel-legacy-version-race.log`, `/tmp/vessel-legacy-version-race-stress.log`, `/tmp/vessel-legacy-version-tidy.log`. These are not repository artifacts. No live ancient Docker/Podman daemon or Windows/npipe runtime execution is claimed by this correction's HTTP/Unix tests. The parent owns the clean final binary rebuild, full suite, live platform repeat and whole-work review; prior artifact results are not relabeled as coverage of this implementation.

### Separate Compose/Swarm CLI legacy negotiation correction (Go1.26.10)

Final implementation/test source: `9ab49584d4cf15b6233d6bc2de370c7c2818e70e`, following implementation `d80935c9b`, expanded coverage `a96e44264`, independently supplied failing-first proof `b77fdf8f7`, and polling-initialization failing-first proof `337162541`. This fixes a confirmed P1 regression in **Docker CLI's separate client**, not the application's already-repaired ClientFactory. Before the fix the unchanged real-HTTP proof requested `/v1.55/info` for advertised1.24,1.39 and a missing API header; all three failed. Advertised1.54 passed. The proof's assertions/fixture remain unchanged; its `REVIEW:` comment has been integrated/removed.

**Public construction and lifecycle:** `WithCli` initializes the Docker CLI configuration, adds custom/agent headers, then injects a fresh API client using public `command.WithInitializeClient`, before any `Client`, `ServerInfo` or `DockerEndpoint` call can initialize the CLI's lazy client. Endpoint resolution uses the initialized CLI's `ContextStore` and `CurrentContext`, `docker.EndpointFromContext`, `docker.WithTLSData` and `Endpoint.ClientOpts`. It deliberately does **not** call `DockerEndpoint()` from the factory: that method would trigger lazy initialization itself. The same CLI/configuration/context store is retained, including the virtual default-context resolver. SDK options are applied only by `client.New`, never to a live/shared SDK client.

The factory's public Ping/fixed-version reconstruction is extracted into `pkg/dockercompat` and reused rather than maintaining separate negotiation algorithms. Before publishing a client, it probes without SDK version mutation, retries one failed Ping (each Ping already has HEAD/GET fallback), validates/normalizes the advertised version via `WithAPIVersion`, preserves the missing-header1.24 fallback, and caps automatic negotiation at the current SDK maximum1.55. It returns an error instead of an unnegotiated client on failed/auth/malformed-version negotiation. The application factory retains its response hooks, HTTP-client setup, configured timeout and request-context behavior.

Docker CLI29.6.1 still calls `Ping` with **forced** negotiation during its own initialization, even with a fixed version. An owned adapter embeds the entire concrete SDK client and satisfies the full `client.APIClient` interface, including hijack/dial and experimental methods. Only `Ping` is overridden: it performs the real SDK Ping without mutating the already-selected version. Its metadata/errors are not replaced or spoofed. This prevents the CLI from re-entering the1.40 floor, resetting the missing-header fallback, overriding an operator's fixed version, or racing version reads during concurrent operations. It is not a copied SDK, partial API facade, request/version-path rewrite, header spoof, reflection, unsafe/private-state mutation or transport interceptor.

`Endpoint.ClientOpts` retains upstream TLS/client-cert/CA/skip-verify and TCP/Unix/npipe/SSH transport construction. CLI User-Agent and config headers are passed as public SDK constructor options. The CLI's private `DOCKER_CUSTOM_HEADERS` CSV parser is unavailable to injected constructors, so a small parser preserves its environment-over-config precedence; permanent tests compare real HTTP headers against **the actual CLI's public `NewAPIClientFromFlags`**, including quoting, duplicate keys, whitespace, empty values and malformed input. Vessel headers are present on the initial negotiation request as well as operations, except when an operator explicitly selects the CLI's documented environment-header override. `DOCKER_API_VERSION` remains an explicit, validated fixed version: no automatic capping/fallback overrides it. Normalized versions and the SDK's ignored empty/whitespace/`v` values are covered. Registry Docker Hub keys, inline credentials, per-registry helpers and conditional global `credsStore` clearing are unchanged.

**Measured construction tradeoff:** the former CLI performed a2s metadata probe during `Client()` initialization, tolerated its failure, and let the old SDK negotiate lazily at the actual operation. The injected compatible client must select a version before being exposed. Initial automatic negotiation now shares a60s whole-probe context budget (matching the application factory's default), not the former2s metadata deadline or the removed5s factory cutoff. Subsequent CLI metadata Ping remains real; ordinary operation transports/timeouts are unchanged. A permanently unavailable daemon now returns a `WithCli` error **before the callback**, instead of invoking it with an unnegotiated client and potentially reporting the connectivity error only from an operation. Configuration-only callbacks no longer succeed against an unavailable daemon. This is intentional, not an assertion of identical lazy-construction/error timing. No callback receives a poisoned default1.55 client. Explicit operator versions skip compatibility probing and retain fixed-version SDK behavior.

An off-repository real-HTTP executable ran the actual CLI28.5.1 plus SDK28.5.2 and a separate executable ran CLI29.6.1 plus the repaired product `WithCli` and application factory. Both use equivalent fixtures and report every requested method/path; no dependency/module/workspace files in this repository were changed for the comparison:

| Fixture | Actual old CLI28.5.1 | Repaired CLI29.6.1 / product factory |
| --- | --- | --- |
| Advertised1.24 /1.39 /1.41 | Correct1.24 /1.39 /1.41 `/info` paths | Same versions and paths |
| Missing API header |1.24 fallback |1.24 fallback |
| Advertised1.54 |1.51 (old SDK maximum) |1.54 |
| Advertised1.999 | Capped1.51 | Capped1.55 |
| Explicit `DOCKER_API_VERSION=1.39`, daemon1.54 | CLI uses1.39 | CLI uses1.39; factory intentionally does not consume CLI env |
| First1.39 HEAD delayed5.2s | CLI succeeds in2.002s after abandoning metadata Ping and issuing a fresh lazy Ping; standalone old SDK succeeds in5.203s | CLI and factory each succeed in5.203s using the valid slow response |
| First complete HEAD+GET probe fails, then recovers at1.24 /1.39 /1.41 /1.54 | CLI succeeds through its later SDK probe (modern capped1.51) | CLI and factory succeed at each advertised version |
| All probes/operations unavailable, then next invocation recovers | CLI operation errors; next invocation uses1.39 | Construction errors with no callback/client; next invocation uses1.39 |

The bare old SDK did **not** itself recover1.24/1.39/1.41 after a fully failed first lazy probe: it retained1.51 and sent the wrong `/info` path. The former CLI's extra metadata probe enabled its recovery. The new shared helper's explicit bounded recovery retry covers both product paths without relying on that incidental distinction. Slow-probe timing is therefore documented, not inferred from only one SDK or a modern live engine.

**Fresh focused verification at the source above:**

```sh
GOTOOLCHAIN=go1.26.10 GOSUMDB=sum.golang.org go test -mod=readonly \
  -p 3 -count=1 -timeout 100s ./backend-src/pkg/libstack/... \
  ./backend-src/api/docker/... ./backend-src/pkg/snapshot ./backend-src/pkg/dockercompat
# PASS; repeat the same command with -race: PASS (eight test-bearing packages,
# two packages without tests). The toolchain executable used locally is
# /tmp/vessel-dep-go-toolchain/go/bin/go.
```

Permanent real HTTP/TLS/Unix tests cover legacy/missing-header/modern/capped versions; slow5.2s first probes at1.24/1.39/1.54; initial complete-probe failures and next-invocation recovery; invalid versions; explicit versions; signed/manager headers before negotiation; verified mTLS (CA and client identity), skip-verify, missing-cert/untrusted-server rejection; named/current/default context resolution, `DOCKER_HOST` precedence and empty Host; Unix1.24; caller values with detached cancellation; internal probe deadlines; registry/helper rules; concurrent construction and concurrent operations/forced Pings with stable versions. The injected adapter retains real CLI server metadata. No original caller context is retained by the SDK.

Real Compose5.3.1 service `Ps` is exercised through the actual `withComposeService` callsite at1.24/1.39/1.41/1.54/missing-header, including an already-cancelled caller that intentionally remains detached. Real Swarm deploy `Info`/manager validation is exercised at those versions; Swarm remove consumes services/secrets/configs/networks at1.39/1.41/1.54. The tests do not pretend secrets/configs exist at1.24. Existing Build/Up/Down detached-context tests and `WaitForStatus` tests now negotiate against isolated HTTP fixtures rather than the developer's default socket. They pass under race: teardown stays detached, while status `Ps` retains the **original caller's** cancellation/deadline/values. A final failing-first HTTP test exposed a related changed-path bug: status polling cancelled during the initial Ping could wait for the new60s detached compatibility budget. An actual CLI28.5.1 reproduction of a completely hanging initial Ping returns its cancelled operation after2.002s; the first eager implementation failed the new3s cancellation bound. The corrected `WithCliContext` entry point retains the original caller for both initialization and operations, and only read-only Compose polling selects it. `WithCli` still delegates with `context.WithoutCancel`, preserving detached teardown. The regression and all existing polling/teardown tests now pass under race. This avoids expanding a cancelled status poll's initialization wait to60s; it does not change teardown's cancellation policy.

`go mod tidy -diff` and `git diff --check`: **PASS**, no module/workspace changes. No Go Swagger annotations, DTOs, generated schemas or frontend contracts changed, so API regeneration is not needed. Release1.3.1, API/datastore2.45.0, Go1.26.10, Node24 and pnpm10.26.2 remain unchanged. No new vulnerability-remediation count or clean overall scan claim is implied.

Ephemeral evidence: `/tmp/vessel-libstack-legacy-before.log`, `/tmp/vessel-libstack-cli-proof-old/main.go`, `/tmp/vessel-libstack-cli-proof-old.log`, `/tmp/vessel-libstack-cli-proof-new/main.go`, `/tmp/vessel-libstack-cli-proof-new.log`, `/tmp/vessel-libstack-affected-normal.log`, `/tmp/vessel-libstack-affected-race.log`, `/tmp/vessel-libstack-tidy.log`, `/tmp/vessel-libstack-poll-negotiation-before.log`, `/tmp/vessel-libstack-poll-negotiation-after.log`, `/tmp/vessel-libstack-poll-old-cli.log`. These fixtures/executables/logs are not repository artifacts. No live ancient Docker/Podman daemon, SSH endpoint or native Windows/npipe execution is claimed. The parent owns the final clean ARM64/AMD64 rebuild, complete backend suite, changed-package race sweep, live platform repeat and mandatory whole-work review; previous binary/platform results are not relabeled as coverage of this correction.

### Alternative graph proof — not shipped or published

The separate experiment in `/tmp/vessel-dep-go-nextgraph` is **not** this release graph. Its isolated Kompose source fork has commits `7646953`, `b71b4c0`, `5b98428` (stable `autoscaling/v2` migration, full suite and stable-HPA-wire regression pass). The isolated Podman container-libs/image fork commit `6dbaaf1` genuinely migrates eight source/test files to Distributionv3; Docker/config/registries/TLS tests pass. These local commits and their upstream provenance remain intact in their own clones. Nothing has been pushed or published.

An off-repository modfile with Compose5.6.1, Prometheus0.315.1, Kubernetes/kubectl0.37.1 and those two source forks tidies successfully and removes the old Docker monolith completely (four original raw alerts). It **does not remove Distributionv2**: Docker CLI29.9.2 still has the real legacy `internal/registryclient` implementation and manifest/store/types and command-test imports (12 source/test files in total), and Compose5.6.1 still requires Distribution2.8.3. Distributionv3 removed `registry/client`, so an import-path identity alias is not a source migration.

Minimal remaining source work is to replace Docker CLI's legacy registry client with maintained OCI/Distributionv3-compatible functionality, migrate its dependent command/test helpers (manifest inspect/create/push and registry error/auth behavior), update CLI requirements and tidy, then update Compose to that migrated CLI and remove/tidy its old Distribution requirement and any remaining source/test imports. The image fork also needs to be consumed through a legitimate approved module publication, not an outside-path `replace`. Kompose needs a maintained/publicly consumable stable-HPA source release. These changes imply upstream contributions or explicitly maintained CLI/Compose/image/Kompose forks and approved publication/module identities; they are **not** safely accomplished by changing this repository's version pins. The maintainer must authorize that maintenance/publication path before shipping it. All five current-graph ranges remain honestly unresolved until an approved buildable graph actually removes them. Package/symbol reachability is separate evidence, not grounds to suppress the advisories.
