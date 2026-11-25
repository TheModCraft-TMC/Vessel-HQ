# Open issue continuation — November 15, 2026

The live repository query returned **35 open issues**. This record covers
all of them and separates existing source changes, this continuation and remaining
acceptance. No GitHub issue was closed and no remote Sonar result was inferred
from local source inspection.

## Sonar source inventory

The 30 synchronized findings target `develop`; the current local branch is
`fix/resource-layout-cycle` with accumulated uncommitted work. Reanalysis of the
reviewed and merged source is required before the sync can close them.

| Issues | Area | Current source disposition |
| --- | --- | --- |
| #266–276 | Release workflow actions | All referenced third-party actions use full immutable commit SHAs. |
| #277–279, #291–293 | Network graph sorting and numeric parsing | Authoring and installed graph sources use explicit code-unit comparators and Number.parseFloat. |
| #280–281 | Trusted builder image | Node base default is digest-pinned; image ends as USER node; readable dependencies contain no operator credentials. |
| #282–283, #287–289 | Tool execution | Docker is resolved to a trusted absolute executable. Image validation uses fixed tool paths and an allowlisted operation, without a shell. |
| #284, #286 | Tooling test assertions | Positive source-policy validation uses assert.doesNotReject; inventory tests assert deep equality. |
| #285 | Temporary archive staging | fs.mkdtemp creates an unpredictable private staging directory; cleanup runs in finally. No static shared filename is used. |
| #290 | Notes loading | Async load handles both success and failure and checks disposal before updating state. |
| #294 | Edition CSS | Removed ignored float from the absolutely positioned link; positioning remains owned by top/right. |
| #297 | Sidebar story | Font-size conversion uses Number.parseFloat. |

## Product and audit issues

| Issue | Current state | Remaining work |
| --- | --- | --- |
| #241 | Shared mobile shell/resource layouts and existing fixtures are implemented. | Complete authenticated phone workflows across the route/provider matrix; fixture screenshots do not close this issue. |
| #262 | Main module graph still selects Docker monolith v28.5.2 and Distribution v2.8.3. Local migration/fork experiments remain isolated under ignored dist/security/issue-262. | Publish maintained immutable modules, consume them without absolute replacements, repeat the full advisory scan and registry/provider compatibility checks. |
| #264 | The exhaustive open-issue inventory contains only #262 from its 18 child findings; #246–261 and #263 are closed. | Reconcile the umbrella after #262 acceptance; historical unchecked boxes are not 17 new source defects. |
| #299 | See the [implementation and acceptance matrix](issue-299.md), including November 14 source and disposable-runtime evidence. | Managed extension lifecycle, absent edition capabilities and remaining remote/provider/HA acceptance are still open. |
| #300 | Compose project export/import/preview and revision conflict protection are present in this working tree. This continuation fixes consecutive saves retaining an obsolete revision, preserving edits made during deployment. | Finish portable CLI/runtime and browser acceptance, then address the separately specified editor/log/terminal workflow slices. |

## Verification

Fresh results for this continuation belong in the
[migration handoff](migration-change-summary.md). Earlier release receipts remain
historical. Stable promotion, production replacement and remote issue closure
are not implied by the current local changes.

## November 20 continuation

A fresh connected GitHub query still returns the same 35 open issues. Fresh
checks and the local Helm test-fixture correction are recorded in the dated
[migration handoff](migration-change-summary.md#open-issue-validation-continuation--november-20-2026).
The current module graph still selects the old Docker and Distribution modules;
the refreshed scanner emits six distinct Go advisory IDs. See the dated
[dependency-security record](../../backend-src/DEPENDENCY_SECURITY.md#historical-pre-publication-scan--november-20-2026).
The original issue-by-issue acceptance above remains outstanding where stated.

## November 21 continuation

Fresh tracker query still returns 35 open issues. #262 now consumes the published
maintained dependency variants; public Go proxy and checksum verification passed.
The actual application's 755-module graph has no obsolete Docker-monolith or
Distribution-v2 identities and no local-path replacements. Full backend tests
passed (157 test packages, exit 0), module verification passed, and the recovered
full-source advisory JSON has zero finding records. Pending race/build gates
resumed after checking that no earlier validator survived. The configured local
Docker socket is absent, so updated-binary provider runtime acceptance remains
outstanding. See the [current handoff](../agent-handoff/progress-2026-11-21.md).
Earlier graph descriptions above are dated historical evidence.
