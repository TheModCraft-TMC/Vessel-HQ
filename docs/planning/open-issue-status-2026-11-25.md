# Open issue status — November 25, 2026

Fresh connected GitHub search returned **35 open issues**. This is a source and
acceptance ledger, not a claim that GitHub or Sonar has closed them. Preserve the
existing [acceptance matrix](issue-299.md) and dated verification evidence.

| Issues | Current source disposition | Required completion evidence |
| --- | --- | --- |
| [#241](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/241) | Existing responsive navigation, layouts and mobile fixes retained | Signed-in mobile acceptance across real workflows; distinguish deployed UI from local source |
| [#262](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/262) | Published maintained dependency variants selected; obsolete Docker monolith and Distribution-v2 identities removed | Fresh published module graph, advisory scan and provider/runtime compatibility checks |
| [#264](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/264) | Existing audit child fixes retained; #262 remains open | Complete remaining child acceptance before closing the tracker |
| #266–276 | Workflow action references use full commit SHA pins | Workflow validation and Sonar analysis on integrated source |
| #277–278, #291–292 | Authoring and compiled topology helpers use explicit sort comparators | Frontend tests and Sonar analysis |
| #279, #293, #297 | Numeric parsing uses `Number.parseFloat` | Frontend tests/lint and Sonar analysis |
| #280 | Builder base image uses an immutable digest | Trusted builder image build and Sonar analysis |
| #281 | Non-root builder; writable cache ownership restricted to three tool cache directories | Trusted builder execution and Sonar analysis; no world-write workaround |
| #282–283, #287–288 | Builder resolves trusted Docker executable; validator uses fixed executable paths and confined environment | Builder/validator regressions and Sonar analysis |
| #284, #286 | Fixture assertions explicitly verify outcomes | Builder/source-policy tests and Sonar analysis |
| #285 | Private temporary directories use `mkdtemp` with cleanup | Development pipeline tests and Sonar analysis |
| #289 | Validator process isolation, fixed tool paths and confined environment retained | Security-rule reanalysis; a unit-test pass does not review a security hotspot |
| #290 | Notes effect handles absent storage, async loading and disposal separately | Notes tests and Sonar analysis |
| #294 | Feature-flag CSS conflicting declarations removed | CSS/frontend guards and Sonar analysis |
| [#299](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/299) | Settings, Git browsing, webhook, activity, optional HA and provider fixes retained; SDK safety stops and scoped realtime refresh added | Full issue-299 matrix, trusted extension compilation, provider and live acceptance; local tests do not certify cross-host fencing/HA |
| [#300](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/300) | Portable Compose import/export/editor work and stream fixes retained; periodic refresh no longer remounts verified extensions | Real portability, editor/log/terminal and runtime acceptance for the stated workflow slices |

## New regression prevention

Periodic snapshot events are distinct from mutations. Idle extension views must
not refetch console metadata every 15 seconds. Provider snapshot fallback remains
available when an engine watch is unproven or disconnected. Revalidation retains
an unchanged verified native view, including an unsaved editor; initial, failed
and revoked approval still block code.

The host SDK circuit breaker records request bursts, repeated failures, repeated
mounts of the same view and render failures. A safety stop blocks new calls,
aborts traffic streams, reports once and revokes the matching reviewed approval.
Notes/settings are retained. A new approval clears the server reason and receives
a new monotonic timestamp; stale tabs cannot revoke it. Restricted users can be
throttled without revoking an extension for other users.

These checks do not isolate trusted browser-context code or stop arbitrary raw
browser APIs. The built-in native extension trust model remains explicit.

Exact receipts, running commands and live access limits are maintained in the
[current handoff](../agent-handoff/progress-2026-11-25.md). No issue has been
closed by this ledger.
