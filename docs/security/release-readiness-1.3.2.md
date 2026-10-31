# 1.3.2 release readiness — October 31, 2026

Status: verification in progress. This record covers local release preparation;
it does not claim a merged PR, tagged release, published image or deployment.

## Fresh npm advisory remediation

The initial live audit reported one low, three moderate and one high finding.
The low deepmerge advisory remains visible with its existing local mitigation.

| Package | Selected fix | Advisory |
| --- | --- | --- |
| follow-redirects | 1.16.2 | [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p) |
| minimatch | 11.0.1 | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| glob, modern consumers | 14.0.2 | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) |

Version-scoped overrides preserve glob 7's callback interface. Compatibility
of legacy CommonJS minimatch callers must be verified against the maintained
matcher before this release is ready.

## Verification results

Pending the final local check run. Toolchain: official checksum-verified Node
24.21.0, pnpm 10.26.2 and Go 1.26.10. The system Homebrew Node 24 installation
cannot load its simdjson library; verification uses a temporary official runtime.

## Remaining release gates

- Fresh remote CI must pass on the final committed release revision.
- Go dependency source migrations/publications (#262) remain unresolved. Do
  not describe the existing module graph as clean or shipped forks as complete.
- Full authenticated production UI/mobile coverage (#241) remains outstanding.
- Docker was unavailable at the initial local check. Cross-compilation does
  not replace executing both image architectures or runtime smoke tests.
- Immutable tag availability, dual-registry digest/platform checks and runtime
  verification are required at publication/deployment time.
