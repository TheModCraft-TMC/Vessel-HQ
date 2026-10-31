# 1.3.2 release readiness — October 31, 2026

Status: `1.3.2` released and deployed on October 31, 2026. Publication and runtime verification are recorded below; known follow-ups remain explicit.

## Fresh npm advisory remediation

The initial live audit reported one low, three moderate and one high finding.
The low deepmerge advisory remains visible with its existing local mitigation.

| Package | Selected fix | Advisory |
| --- | --- | --- |
| follow-redirects | 1.16.2 | [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p) |
| minimatch | 11.0.1 | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| glob, modern consumers | 14.0.2 | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) |

Version-scoped overrides preserve glob 7's callback interface. The documented
[minimatch adapter](../../patches/README.md#minimatch-1101) preserves callable
CommonJS imports and parsed-segment matching for glob 7. Frozen installation
and regression tests passed for callable/named/ESM imports, defaults, dotfiles,
brace patterns, nested traversal, callback/sync APIs and modern cancellation.

## Verification results

Toolchain: official checksum-verified Node 24.21.0, pnpm 10.26.2 and Go 1.26.10.
The system Homebrew Node 24 installation cannot load its simdjson library;
local verification uses a temporary official runtime.

| Check | Result and scope |
| --- | --- |
| Frozen dependency install | Passed; unrelated resolved versions and peer metadata preserved |
| Fresh npm audit | Passed: 1 low, 0 moderate/high/critical; no exclusions |
| Recorded npm regression ranges | All 61 supplied ranges eliminated |
| Architecture guards | Modernization, boundaries (3,324 source files) and App Router passed |
| Node script tests | 51 passed; final focused audit/glob checks also passed after formatting |
| Release version and mirror scripts | Passed, including failure/promotion cases |
| Frontend tests | Full suite passed in hosted CI on `0a60c88cd`; local run timed out finding a PVC resize button, then all 11 PVC tests passed in isolation |
| Lint | Passed locally: 0 errors, 192 warnings |
| Production build | Local webpack build and Next.js standalone packaging passed |
| Local standalone smoke | Packaged `/login` returned HTTP 200 with Vessel branding |
| Go suite | Full `GOWORK=off go test -p 3 ./...` passed after the Helm fixture repair; Kubernetes used a nonexistent kubeconfig, so this is not live-cluster coverage |
| Hosted release checks | [Publication workflow](https://github.com/TheModCraft-TMC/Vessel-HQ/actions/runs/41206208431) passed on `b4a82cf24e4ea6dc7aaab081f9a4edfeb7f97f46`, including frontend/harness, Go, release context and both platform image executions; both binaries reported `1.3.2` |
| Registry publication | Docker Hub version/latest inspected independently; GHCR version/latest verified by authenticated CI; all share `sha256:da06e29cafd61278ff86ef4a25b600199e5e914f085066e848ab2eee64999014` |
| Production deployment | Verified release `1.3.2`, preserved runtime/data volume, API/login HTTP 200, zero restarts, checksum-verified backup and stopped prior container retained |
| Documentation | Changed-document local links and whitespace checked |
| Develop CI-sync integration | 33 issue-sync and 19 pinned root-review unit tests passed after retaining both documentation sections |

The Go run exposed a pre-existing test that expected `my-registry.io` to reject
login. That external hostname now responds successfully, and both local and
hosted runs failed the assertion. The replacement uses a local OCI registry
fixture, checks that configured Basic credentials arrive and returns a
controlled authentication rejection. The focused test and full Go rerun pass;
production authentication behavior is unchanged.

The develop integration retained the Sonar issue-sync repair from PR #265 and both documentation records. The combined PR passed before merge. The stable tag points to `b4a82cf24e4ea6dc7aaab081f9a4edfeb7f97f46`; the publication workflow built and verified that exact source, published both registries, and promoted matching channel aliases.

## Known follow-ups and future releases

- Go dependency source migrations/publications (#262) remain unresolved. The selected Docker monolith/Distribution advisory ranges have not been removed; this is not a clean Go advisory scan claim.
- Full authenticated production UI/mobile coverage (#241) remains outstanding. Deployment verification covered the public API/login, runtime configuration and release identity.
- Future releases must repeat immutable-tag availability, image architecture execution, registry digest/channel checks and runtime verification. Never reuse the published `v1.3.2` or image version.
