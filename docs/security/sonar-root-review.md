# Manual SonarCloud root-bootstrap review (PR #234 only)

This is an operator path for recording **six specific, already-reviewed**
`docker:S6471` findings, not an automatic risk-acceptance policy. It does not fix
or suppress other vulnerabilities, alter Docker startup identities, weaken the
quality gate, or exempt future files/findings. The
[remediation ledger](../planning/github-issue-remediation.md#sonarcloud-review-access)
contains the compatibility rationale; [PR #234](https://github.com/TheModCraft-TMC/Vessel-HQ/pull/234)
contains the source changes. Backend dispositions remain separate in the
[backend security review](../../backend-src/SECURITY_REVIEWS.md).

## Closed review set

Project: `TheModCraft-TMC_Vessel-HQ`. Rule: `docker:S6471`.

| GitHub case | Sonar key | Scope | Dockerfile |
| --- | --- | --- | --- |
| #146 | `AaFI-OLnL6mSFxVklHVC` | `develop` | `build/release-context.Dockerfile` |
| #156 | `AaFI-OMJL6mSFxVklHVJ` | `develop` | `Dockerfile` |
| #165 | `AaFI-OLfL6mSFxVklHVB` | `develop` | `build/linux/Dockerfile` |
| #166 | `AaFI-OKkL6mSFxVklHVA` | `develop` | `build/linux/alpine.Dockerfile` |
| #221 | `AaFI-OJvL6mSFxVklHU2` | `develop` | `build/linux/dev-toolkit/toolkit.Dockerfile` |
| #221 counterpart | `AaFgfrDLBmL4uU2_jom2` | PR `234` | `build/linux/dev-toolkit/toolkit.Dockerfile` |

The [manifest](../../scripts/sonar-root-review.json) pins Dockerfile source hashes
from `git show 5b175344be4a37e01a3adb2d859cf05a1d54c4e8:<path>` for
`develop`, and `git show 2d88f8851b47b86f2afb4c1ec6937dd714f97bd8:<path>`
for the PR counterpart. Both toolkit cases also pin `run.sh`, which performs
privileged host UID/GID and socket-group setup before dropping to `PUSER` via
`su`. Production root startup preserves existing data-directory/socket access;
these images are not claimed to drop privileges automatically. This is a
review of an intentional deployment trust boundary, **not** a false positive.

Hash normalization changes CRLF to LF and replaces trailing LF runs (including
no final LF) with one LF; every other byte, including comments, is significant.
The helper pins the manifest's own SHA-256 separately. No arbitrary issue key,
rule, path, project, scope, API host, or manifest CLI override is supported.

## Prerequisites and operator approval

1. An authorized maintainer must review the manifest/rationale and the workflow
   revision before allowing the job to use a secret. Never run an untrusted
   workflow revision with this credential.
2. Store a suitable **user token** as the repository Actions secret
   `SONAR_TOKEN`, using GitHub's secret UI or an approved secret-management
   channel. Do not paste it into an issue, chat, CLI argument, committed file, or
   workflow dispatch input. No credential is included in this change.
3. The user must have project Browse and See Source Code access, plus Administer
   Issues authorization for `accept` (or legacy `wontfix`). A token that can only
   run analysis is not sufficient. Sonar's published API currently marks these
   source/write endpoints as not supporting scoped organization tokens.
4. Avoid concurrent pushes/analysis or manual edits to these findings while
   recording the review. The API has no multi-issue transaction or conditional
   source-hash transition; all guards are read-before-write checks, not locks.

The helper requires `/api/users/current` to report `isLoggedIn: true`.
`/api/authentication/validate` reporting `valid: true` is **not** accepted as
proof of login: that response can occur anonymously.

## Dispatch: preview first, then explicitly apply

The existing workflow must already be registered on the default branch. Resolve
its ID (read-only), then dispatch its reviewed feature-branch definition:

```sh
WORKFLOW_ID="$(gh api repos/TheModCraft-TMC/Vessel-HQ/actions/workflows \
  --jq '.workflows[] | select(.path == ".github/workflows/sonarcloud-issues.yml") | .id')"
gh workflow run "$WORKFLOW_ID" --repo TheModCraft-TMC/Vessel-HQ \
  --ref fix/all-github-issues \
  -f root_review=true -f root_review_apply=false -f dry_run=true
```

Inspect the completed run: all six cases must pass authentication, exact
project/rule/component/key/scope checks, source hashes read through
`api/sources/raw`, and authorized transitions/comment actions. The dry-run log
contains only the plan (keys, selected transitions, dedupe state), not tokens or
source text. A missing key, wrong scope, changed file, missing permission, source
404, or other API error refuses the initial plan with **zero writes**. No future
key is substituted for a missing one.

After successful preview and explicit maintainer approval:

```sh
gh workflow run "$WORKFLOW_ID" --repo TheModCraft-TMC/Vessel-HQ \
  --ref fix/all-github-issues \
  -f root_review=true -f root_review_apply=true -f dry_run=false
```

`root_review` and `root_review_apply` both default to **false**. The helper is
also dry-run by default; only `--apply` enables writes. `dry_run=true` overrides
the apply input. With `root_review=true`, the GitHub issue-sync job is skipped,
including when dispatched on `develop`. The separate review job has only
`contents: read` GitHub permissions. PRs, pushes, and cron cannot run it or obtain
its Sonar secret. Ordinary issue sync still uses public Sonar reads and retains
its existing GitHub issue-write permissions; it no longer receives `SONAR_TOKEN`.

For an approved local environment with `SONAR_TOKEN` already securely injected:

```sh
python3 scripts/review-sonar-root.py          # read-only preflight
python3 scripts/review-sonar-root.py --apply  # explicit authorized recording
```

## Recording, errors, and verification

- Before **any** POST, all six cases are preflighted again. An active case must
  advertise `accept`, or, only if absent, legacy `wontfix`. The helper never uses
  `falsepositive`, hotspot transitions, exclusions, or gate edits.
- Each active case gets one rationale comment with PR/ledger links, reviewed
  hashes/revision, and a visible per-key dedupe marker. Only then is the
  transition submitted. A readback confirms terminal status before reporting
  success. The comment itself does not claim the transition succeeded.
- Already accepted/fixed/otherwise recognized terminal cases are left alone,
  without additional comments. An existing marker on an active case prevents
  duplicate comments after a partial run.
- Sonar POSTs are form-urlencoded with Bearer authentication from the environment.
  Redirects are refused; responses/errors do not echo tokens or response bodies.
  There are **no internal retries**, especially no retry after a write timeout,
  rate limit, or server error that might have committed a mutation.
- Later errors can leave a partial batch (the service has no transaction).
  Stop, inspect the remote cases, then run a fresh preview before another apply.
  Do not assume a timed-out request failed, and do not force a transition past a
  failed source/permission check. A stale/racing analysis can still occur between
  the final guard and POST; schedule a quiet review window.
- If a base image, entrypoint, comment, or other pinned source changes, **do not
  relax hash checks**. Review the new content, derive the corresponding hashes
  using the helper's `source_hash` function on `git show <revision>:<path>` bytes,
  update the affected manifest entries/review revision, and refresh
  `MANIFEST_SHA256` from the manifest's exact bytes. Review that focused diff and
  rerun tests/preview. Do not extend the set to new findings without a separate
  authorized review.

After actual recording, inspect all six statuses and audit comments in
SonarCloud, rerun PR #234's normal Sonar analysis, and check the live quality gate
on the **current PR head**. A successful transition is not proof of a green gate
or dependency-alert remediation. Do not describe this work as remote acceptance
until API success and readback actually occurred.

## Fresh checks for this operator path

```sh
python3 -m unittest discover -s scripts -p test_review_sonar_root.py
python3 -m unittest discover -s scripts -p test_sync_sonarcloud_issues.py
# With actionlint installed:
actionlint -shellcheck= .github/workflows/sonarcloud-issues.yml
git diff --check
```

At implementation time, anonymous read-only searches confirmed all six exact
keys/project/rule/paths and PR scope; all remained OPEN with no authorized
transitions. Anonymous `api/sources/raw` returned HTTP 404, so no live source
hash comparison or authenticated preflight could be completed. This is a hard
stop, not a reason to fall back to issue-line hashes or skip source validation.
No workflow was dispatched, no remote comment/transition was sent, and no
credential was acquired. The authorized credential and live apply/gate
verification remain operator-owned follow-up.
