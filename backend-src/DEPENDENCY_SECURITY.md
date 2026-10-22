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

## Patched current-graph checkpoint (Go1.26.10)

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

The probe uses the configured HTTP timeout (default60s, an explicit positive override, or unlimited when0), not an unrelated5s cutoff. Its **whole negotiation**, including one recovery retry of a failed SDK Ping, is bounded by that budget and the caller's earlier cancellation/deadline. Each SDK Ping already has HEAD/GET fallback; the recovery regression fails **both** methods of the first probe. A failed/cancelled negotiation returns an error and **nil client**, never an unnegotiated client. After a failed construction the next construction may retry a recovered endpoint. An unreachable endpoint does not loop indefinitely: there are at most two SDK Ping calls. Local Unix/npipe transports retain SDK transport configuration and use the caller context (they did not have an HTTP timeout in the former factory).

**Explicit construction tradeoff:** the old SDK had truly lazy construction. That cannot be preserved together with pre1.40 negotiation while still returning its replacement's concrete `*client.Client`: split SDK0.5.1's `negotiateAPIVersion` rejects <1.40, and its public version option is a constructor option, not a safe mutable-client setter. Returning a fresh unnegotiated client after a failed probe merely re-enters that hard floor. An owned lazy facade would require replacing concrete SDK types/interfaces throughout consumers and delegating all used SDK methods; transport/header rewriting or private-state mutation are not acceptable alternatives. This bounded correction retains **eager** construction from the initial adapter, but now reports network/auth/version errors at construction and does not return a poisoned client. All production callers check constructor errors; the image-status caller now also returns on that error instead of dereferencing nil. `CreateClientWithContext` threads existing HTTP request/deployment/image-operation contexts into negotiation. Call sites whose work already used background contexts retain the `CreateClient` compatibility entry point. No caller context is retained in the returned client; later operations still use their own contexts. Detached Compose execution remains detached as before.

Failing-first real-HTTP tests demonstrate the prior failures for slow1.24/1.39 and recovered1.24/1.39 engines; modern1.54 also proves the first valid slow response must not be cut off. The corrected tests and existing TCP/TLS/agent/Unix protocol tests pass under the race detector on Go1.26.10. Additional real-HTTP tests cover first-probe recovery at1.41/1.54, concurrent operations on one negotiated client, malformed versions, max-version capping, short HTTP timeout, cancellation during construction with HTTP timeout0, and cancellation after successful construction. These are SDK/HTTP compatibility tests, not claims of live ancient-daemon feature coverage.

### Alternative graph proof — not shipped or published

The separate experiment in `/tmp/vessel-dep-go-nextgraph` is **not** this release graph. Its isolated Kompose source fork has commits `7646953`, `b71b4c0`, `5b98428` (stable `autoscaling/v2` migration, full suite and stable-HPA-wire regression pass). The isolated Podman container-libs/image fork commit `6dbaaf1` genuinely migrates eight source/test files to Distributionv3; Docker/config/registries/TLS tests pass. These local commits and their upstream provenance remain intact in their own clones. Nothing has been pushed or published.

An off-repository modfile with Compose5.6.1, Prometheus0.315.1, Kubernetes/kubectl0.37.1 and those two source forks tidies successfully and removes the old Docker monolith completely (four original raw alerts). It **does not remove Distributionv2**: Docker CLI29.9.2 still has the real legacy `cli/registry/client` implementation and test-helper imports, and Compose5.6.1 still requires Distribution2.8.3. Distributionv3 removed `registry/client`, so an import-path identity alias is not a source migration.

Minimal remaining source work is to replace Docker CLI's legacy registry client with maintained OCI/Distributionv3-compatible functionality, migrate its dependent command/test helpers (manifest inspect/create/push and registry error/auth behavior), update CLI requirements and tidy, then update Compose to that migrated CLI and remove/tidy its old Distribution requirement and any remaining source/test imports. The image fork also needs to be consumed through a legitimate approved module publication, not an outside-path `replace`. Kompose needs a maintained/publicly consumable stable-HPA source release. These changes imply upstream contributions or explicitly maintained CLI/Compose/image/Kompose forks and approved publication/module identities; they are **not** safely accomplished by changing this repository's version pins. The maintainer must authorize that maintenance/publication path before shipping it. All five current-graph ranges remain honestly unresolved until an approved buildable graph actually removes them. Package/symbol reachability is separate evidence, not grounds to suppress the advisories.
