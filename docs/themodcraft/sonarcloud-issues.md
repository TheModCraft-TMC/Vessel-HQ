# SonarCloud issue synchronization

The `Sync SonarCloud issues` GitHub Actions workflow mirrors all open findings from
SonarCloud project `TheModCraft-TMC_Vessel-HQ`, branch `develop`, into this
repository's GitHub Issues tracker. It runs hourly at minute 23, after changes to
the sync implementation on `develop`, or manually from the Actions tab. GitHub may
delay scheduled runs; findings appear after a completed SonarCloud analysis and
the next sync. This workflow reads existing analyses; it does not run a scanner.

No additional service, dependencies, AI calls, or SonarCloud token are required
while the project is publicly readable. GitHub provides a short-lived workflow
token with `issues: write`. Normal sync deliberately does **not** receive the
`SONAR_TOKEN` Actions secret; adding that secret does not change sync reads.
The token is available only to the explicitly requested manual
[root-review job](../security/sonar-root-review.md), with its own authenticated
preflight and preview/apply controls. The standalone sync script can still use an
operator-provided `SONAR_TOKEN` environment variable for authenticated reads;
the normal workflow does not provide one. An API authentication failure fails
the run rather than treating findings as resolved.

Each finding gets a `sonarcloud` label, rule, file/line, impact, SonarCloud link,
and hidden project/branch/issue-key marker. Security findings are included as
requested by the maintainer. The sync copies no source snippets or secret values.
The issue title identifies the rule and file; the linked SonarCloud page provides
the finding description and remediation.

SonarCloud is the source of truth: open findings reopen their previously closed
GitHub issue. To dismiss a finding, mark it accepted or false positive in
SonarCloud. Explicit fixed/closed findings close as completed; accepted or
false-positive findings close as not planned. Missing, inaccessible, deleted, or
out-of-scope findings do not automatically close GitHub issues. Findings that
were already accepted or false positive are never imported.

Maintainer notes outside `sonarcloud-sync:start` / `sonarcloud-sync:end` markers
are preserved. Keep these markers intact. The workflow only manages issues with
its matching project/branch/key marker and leaves unrelated issues untouched.
Concurrent runs are serialized, pages are checked before writing, and writes
are paced to respect GitHub secondary limits. After a partial failure, rerun the
workflow: existing markers prevent duplicate creation. Large initial imports can
take several minutes. GitHub Actions disables schedules in inactive public
repositories after 60 days; re-enable the workflow if needed.

For a preview, select **Actions → Sync SonarCloud issues → Run workflow**, choose
`develop`, and enable `dry_run`. A normal manual run performs the sync. To pause
imports, disable the workflow in Actions. Existing imported issues remain.

Local verification (Python 3.9+):

```sh
python3 -m unittest discover -s scripts -p test_sync_sonarcloud_issues.py
GH_TOKEN="$(gh auth token)" python3 scripts/sync-sonarcloud-issues.py --dry-run
```

No external bug tracker or GitHub Projects board is configured by this workflow.
