# 1.3.2 release readiness — October 31, 2026

Status: source prepared; final PR checks and the publication checklist remain
required. This record does not claim a merged PR, tagged release, published
image or deployment.

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
| Frontend tests | Full suite passed in hosted CI on `e0135f589`; local run timed out finding a PVC resize button, then all 11 PVC tests passed in isolation |
| Lint | Passed locally: 0 errors, 192 warnings |
| Production build | Local webpack build and Next.js standalone packaging passed |
| Go suite | Full `GOWORK=off go test -p 3 ./...` passed after the Helm fixture repair; Kubernetes used a nonexistent kubeconfig, so this is not live-cluster coverage |
| Hosted frontend/harness checks | Passed on `e0135f589`, including typecheck, Storybook and integration harness safety |
| Documentation | 67 local links checked; whitespace check passed |

The Go run exposed a pre-existing test that expected `my-registry.io` to reject
login. That external hostname now responds successfully, and both local and
hosted runs failed the assertion. The replacement uses a local OCI registry
fixture, checks that configured Basic credentials arrive and returns a
controlled authentication rejection. The focused test and full Go rerun pass;
production authentication behavior is unchanged.

The subsequent change touches that test and verification documentation only.
Final production packaging and both image architecture execution checks are
enforced by the release job on [PR #245](https://github.com/TheModCraft-TMC/Vessel-HQ/pull/245).
Use the final head's results before merging or publishing; the earlier failed
run is not a successful release build.

## Remaining release gates

- Fresh remote CI must pass on the final committed release revision.
- Go dependency source migrations/publications (#262) remain unresolved. Do
  not describe the existing module graph as clean or shipped forks as complete.
- Full authenticated production UI/mobile coverage (#241) remains outstanding.
- Docker Desktop was started for validation. Cross-compilation does not
  replace executing both image architectures or runtime smoke tests.
- `v1.3.2` was absent from GitHub tags and Docker Hub returned HTTP 404 for
  `1.3.2` on October 31. Recheck immutable tags at publication time.
- Immutable tag availability, dual-registry digest/platform checks and runtime
  verification are required at publication/deployment time.
