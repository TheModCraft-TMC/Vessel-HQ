# October 29 audit follow-up

This follows [audit #264](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/264)
on the existing `fix/github-issues-code-mode-mobile` branch. Verification below
must be read separately from the October 23 PR checks.

## Local remediation scope

- #246: Vault renewal uses observed TTL/period to leave a safety margin; committed
  source creation/updates wake the worker. Failed checks retry after one second.
- #247: normal Git downloads return checked-out HEAD before removing `.git`.
  Azure resolves once and downloads that immutable commit. Deployment records
  the returned commit instead of querying a moving remote ref after cloning.
- #248–#250: typed Git updates validate before mutation; rejected intervals return
  HTTP 400. Preview cleanup is registered before clone; Azure owns cleanup until
  a complete, closed archive is returned. Read-only preview/discovery propagates
  cancellation, including waiting callers of deduplicated discovery requests.
- #251–#254: filters/page size reset activity-log pagination; the shared table
  consumes controlled pagination. CSV ignores pagination and retains filters.
  Invalid/negative pagination returns HTTP 400. Base64 bytes decode as UTF-8.
- #255–#257: modern v1/v2 memory-cache counters with safe bounds; aggregate device
  reads/writes; headerless manifests hash the exact text to `sha256:<hex>`.
- #258: both update and stored connection-test schemas describe Git and Vault
  fields, selected by the stored source type. Generated SDK types replace the
  handwritten Vault payload and raw Axios branches.
- #259: Zod is pinned to 4.6.6, the patched version identified by
  [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
  Next.js aligns with develop's existing 16.4.1 pin after the fresh scan found
  three advisories against this branch's older 16.3.8 pin.
- #260: deepmerge 4.3.1 has no published patch for
  [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
  A pnpm patch makes all merge destination writes own data properties, avoiding
  inherited setters for attacker-controlled keys. It covers published CommonJS,
  UMD and source entry files. Regression tests exercise the installed transitive
  build dependency. `pnpm why` also confirms a production path through
  `codemirror-json-schema -> json-schema-library -> deepmerge`; the patch applies
  to that shared resolved version too. Formik uses separate deepmerge 2.2.1,
  outside this advisory range. The version-based low advisory remains visible; this is a
  local mitigation, not a claim of upstream advisory clearance.
- #261: PR/stable, manual frontend verification and beta validation query fresh
  npm advisories, block moderate/high/critical findings, fail on unavailable or
  incomplete results, and retain reports for 30 days. The offline snapshot
  regression check remains. Low findings are reported without global exclusions.
- #263: project-owned security support/reporting policy. GitHub private reporting
  was read back as enabled; no private report or message was sent.

## Maintained Go forks (#262)

The [existing module analysis](../../backend-src/DEPENDENCY_SECURITY.md#alternative-graph-proof--not-shipped-or-published)
identifies required source migrations in Docker CLI/Compose, Kompose and the
container image library. Pin changes or import-identity aliases do not remove
these implementations. No external fork was published and no advisory was
suppressed by this follow-up. The maintainer authorized maintained project forks and publication on October
29. Migration and publication are now in progress; no replacement graph is
claimed as shipped until its tagged modules resolve and compatibility checks pass. The issue remains open until those real requirements/imports are
removed and the compatibility matrix is rerun. The fresh full-source scan reports 14 records across six advisory IDs after
fixing two newer x/net advisories with v0.62.0. The original five raw advisory
ranges remain selected. See the dependency inventory for exact counts, versions
and the module-only OpenPGP finding; this is not a clean Go scan.

## Verification

In progress. No issue closure, PR merge, release or production deployment is
claimed by these local changes. Authenticated production route coverage and the
full mobile audit remain separate open work (#241); the previous saved browser
origin denial is not bypassed.
