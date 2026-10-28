#!/usr/bin/env python3
"""Mirror open main-branch SonarCloud findings into GitHub Issues (stdlib only)."""
import argparse
from datetime import timezone
from email.utils import parsedate_to_datetime
import json
import os
import re
import time
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

PROJECT = "TheModCraft-TMC_Vessel-HQ"
BRANCH = "develop"
LABEL = "sonarcloud"
START = "<!-- sonarcloud-sync:start -->"
END = "<!-- sonarcloud-sync:end -->"
ACTIVE = {"OPEN", "CONFIRMED", "REOPENED"}
TERMINAL = {"FIXED", "FALSE_POSITIVE", "ACCEPTED", "CLOSED"}
MARKER = re.compile(r"<!-- sonarcloud:([^:]+):([^:]+):([^\s]+) -->")


def retry_delay(value):
    try:
        delay = int(value)
    except (TypeError, ValueError):
        try:
            retry_at = parsedate_to_datetime(value)
            if retry_at.tzinfo is None:
                retry_at = retry_at.replace(tzinfo=timezone.utc)
            delay = retry_at.timestamp() - time.time()
        except (TypeError, ValueError, OverflowError):
            delay = 60
    return max(60, delay)


class Api:
    def __init__(self, github_token, sonar_token=""):
        self.github_token = github_token
        self.sonar_token = sonar_token

    def request(self, service, path, method="GET", data=None):
        base = "https://api.github.com" if service == "github" else "https://sonarcloud.io"
        token = self.github_token if service == "github" else self.sonar_token
        headers = {"Accept": "application/json", "User-Agent": "vessel-sonarcloud-sync"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if service == "github":
            headers["X-GitHub-Api-Version"] = "2022-11-28"
        body = json.dumps(data).encode() if data is not None else None
        if body:
            headers["Content-Type"] = "application/json"
        for attempt in range(4):
            try:
                with urlopen(Request(base + path, data=body, headers=headers, method=method), timeout=45) as response:
                    raw = response.read()
                    return json.loads(raw) if raw else None
            except HTTPError as error:
                # Never retry writes after sleeping: the live-head guard
                # belongs to sync(), and a push during backoff makes its plan stale.
                # The next run rechecks freshness and deduplicates committed creations.
                retry = method == "GET" and (
                    error.code == 429 or (error.code == 403 and error.headers.get("Retry-After"))
                    or error.code >= 500
                )
                if not retry or attempt == 3:
                    raise RuntimeError(f"{service} {method} failed: HTTP {error.code}") from None
                time.sleep(retry_delay(error.headers.get("Retry-After")))
        raise RuntimeError("API retry limit exceeded")

    def sonar(self, **params):
        return self.request("sonar", "/api/issues/search?" + urlencode(params))


def status(issue):
    return issue.get("issueStatus") or issue.get("status")


def marker(key):
    return f"<!-- sonarcloud:{PROJECT}:{BRANCH}:{key} -->"


def content(issue):
    key = issue["key"]
    path = issue["component"].removeprefix(PROJECT + ":")
    location = path + (f":{issue['line']}" if issue.get("line") else "")
    impacts = ", ".join(f"{i['softwareQuality']}: {i['severity']}" for i in issue.get("impacts", []))
    link = "https://sonarcloud.io/project/issues?" + urlencode({"id": PROJECT, "open": key, "branch": BRANCH})
    title = f"[SonarCloud] {issue['rule']} in {path}"[:250]
    body = "\n".join([
        START, marker(key), f"SonarCloud finding: [{key}]({link})", "",
        f"- Rule: `{issue['rule']}`", f"- Location: `{location}`",
        f"- Branch: `{BRANCH}`", f"- Impact: {impacts or issue.get('severity', 'Unknown')}",
        f"- SonarCloud status: `{status(issue)}`", "",
        "See SonarCloud for the finding description and remediation. Source snippets and secret values are not copied here.",
        END,
    ])
    return title, body


def replace_content(previous, generated):
    if previous.count(START) != 1 or previous.count(END) != 1 or previous.index(START) > previous.index(END):
        raise RuntimeError("Managed issue content was removed or malformed; restore its sync markers first")
    before, rest = previous.split(START, 1)
    _, after = rest.split(END, 1)
    return before + generated + after


def fetch_active(api):
    findings = []
    expected = None
    for page in range(1, 21):
        data = api.sonar(componentKeys=PROJECT, branch=BRANCH, issueStatuses="OPEN,CONFIRMED", ps=500, p=page)
        total = data["paging"]["total"]
        if expected is None:
            expected = total
        if total != expected or total > 10000:
            raise RuntimeError("SonarCloud results changed or exceed the search limit; retry or partition the query")
        findings.extend(data["issues"])
        if len(findings) >= total:
            if len(findings) != total or len({i['key'] for i in findings}) != total:
                raise RuntimeError("Incomplete or duplicate SonarCloud results; no issues changed")
            if any(i.get("project") != PROJECT or status(i) not in ACTIVE for i in findings):
                raise RuntimeError("Unexpected SonarCloud project or status; no issues changed")
            return findings
        if not data["issues"]:
            raise RuntimeError("Incomplete SonarCloud pagination; no issues changed")
    raise RuntimeError("SonarCloud pagination limit reached")


def branch_head(api, repo):
    # Resolve the live source branch, never the workflow checkout or GITHUB_SHA.
    data = api.request("github", f"/repos/{repo}/commits/{BRANCH}")
    sha = data.get("sha")
    return sha if isinstance(sha, str) and sha.strip() else None


def fresh_revision(api, repo):
    head = branch_head(api, repo)
    data = api.request("sonar", "/api/project_analyses/search?" + urlencode({
        "project": PROJECT, "branch": BRANCH, "ps": 1,
    }))
    analyses = data.get("analyses") or []
    revision = analyses[0].get("revision") if analyses else None
    # Sandwich the analysis read between head reads: a push during the read is stale too.
    current_head = branch_head(api, repo)
    return head if head and head == revision == current_head else None


def wait_for_fresh_analysis(api, repo, timeout=600, poll_interval=30):
    deadline = time.monotonic() + timeout
    while True:
        revision = fresh_revision(api, repo)
        if revision:
            return revision
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise RuntimeError("SonarCloud analysis is missing a revision or behind the live branch; no issues changed")
        print("Waiting for SonarCloud analysis of the live branch (read-only)", flush=True)
        time.sleep(min(poll_interval, remaining))


def sync(api, repo, dry_run=False):
    revision = wait_for_fresh_analysis(api, repo)
    findings = fetch_active(api)
    grouped = {}
    for page in range(1, 1001):
        batch = api.request("github", f"/repos/{repo}/issues?" + urlencode({"state": "all", "per_page": 100, "page": page}))
        for issue in batch:
            if "pull_request" in issue:
                continue
            match = MARKER.search(issue.get("body") or "")
            if match and match.group(1, 2) == (PROJECT, BRANCH):
                key = match.group(3)
                grouped.setdefault(key, []).append(issue)
        if len(batch) < 100:
            break
    else:
        raise RuntimeError("GitHub pagination limit reached")

    existing = {}
    historical_duplicates = []
    for key, tickets in grouped.items():
        open_tickets = [ticket for ticket in tickets if ticket["state"] == "open"]
        if len(open_tickets) > 1:
            numbers = ", ".join(f"#{ticket['number']}" for ticket in sorted(open_tickets, key=lambda t: t["number"]))
            raise RuntimeError(f"Duplicate open managed GitHub issues for {key}: {numbers}; resolve before syncing")
        # Prefer the live conversation; otherwise the newest issue carries the
        # most recent disposition. Closed history is retained, never rewritten.
        current = open_tickets[0] if open_tickets else max(tickets, key=lambda t: t["number"])
        existing[key] = current
        if len(tickets) > 1:
            historical_duplicates.append({
                "canonical": current["number"],
                "closed": sorted(ticket["number"] for ticket in tickets if ticket is not current),
            })

    # Read explicit status for missing findings before any writes. Absence alone never closes an issue.
    active_keys = {i["key"] for i in findings}
    missing = [key for key, issue in existing.items() if key not in active_keys and issue["state"] == "open"]
    resolved = {}
    for offset in range(0, len(missing), 100):
        data = api.sonar(componentKeys=PROJECT, branch=BRANCH, issues=",".join(missing[offset:offset + 100]), ps=100)
        for issue in data["issues"]:
            if issue.get("project") == PROJECT and status(issue) in TERMINAL:
                resolved[issue["key"]] = issue

    changes = []
    preserved_not_planned = []
    for finding in findings:
        title, generated = content(finding)
        current = existing.get(finding["key"])
        if current is None:
            changes.append(("POST", f"/repos/{repo}/issues", {"title": title, "body": generated + "\n\n", "labels": [LABEL]}))
        elif current["state"] == "closed" and current.get("state_reason") == "not_planned":
            # A maintainer's explicit disposition is independent of Sonar's
            # still-open status. Reopening requires a deliberate GitHub action.
            preserved_not_planned.append(current["number"])
        else:
            body = replace_content(current.get("body") or "", generated)
            patch = {}
            if body != current["body"]:
                patch["body"] = body
            if title != current["title"]:
                patch["title"] = title
            if current["state"] != "open":
                patch.update(state="open", state_reason="reopened")
            if patch:
                changes.append(("PATCH", f"/repos/{repo}/issues/{current['number']}", patch))
    for key, finding in resolved.items():
        current = existing[key]
        _, generated = content(finding)
        changes.append(("PATCH", f"/repos/{repo}/issues/{current['number']}", {
            "body": replace_content(current.get("body") or "", generated), "state": "closed",
            "state_reason": "completed" if status(finding) in {"FIXED", "CLOSED"} else "not_planned",
        }))

    # Never apply a plan from an older snapshot, even if a newer analysis is now fresh.
    if fresh_revision(api, repo) != revision:
        raise RuntimeError("Branch or SonarCloud analysis changed during planning; no issues changed")

    def guard_write():
        # Long batches must stop as soon as a new push makes this plan obsolete.
        # Analysis was checked after planning; only head reads are needed per write.
        if branch_head(api, repo) != revision:
            raise RuntimeError("Branch changed during sync; stopped before the next GitHub mutation")

    summary = {"open_findings": len(findings), "create": sum(m == "POST" for m, _, _ in changes),
               "update_or_close": sum(m == "PATCH" for m, _, _ in changes), "dry_run": dry_run,
               "historical_duplicates": sorted(historical_duplicates, key=lambda group: group["canonical"]),
               "preserved_not_planned": sorted(preserved_not_planned)}
    print(json.dumps(summary), flush=True)
    if not dry_run and changes:
        labels = api.request("github", f"/repos/{repo}/labels?per_page=100")
        if LABEL not in {label["name"] for label in labels}:
            guard_write()
            api.request("github", f"/repos/{repo}/labels", "POST", {
                "name": LABEL, "color": "F3702A", "description": "Automatically synchronized SonarCloud finding"})
            time.sleep(1.1)
        for method, path, data in changes:
            guard_write()
            result = api.request("github", path, method, data)
            print(f"Synced GitHub issue #{result['number']}", flush=True)
            time.sleep(1.1)  # Stay below GitHub's secondary content-creation limits.
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY", "TheModCraft-TMC/Vessel-HQ")
    if repo != "TheModCraft-TMC/Vessel-HQ":
        raise SystemExit("This sync is scoped to TheModCraft-TMC/Vessel-HQ")
    if not token:
        raise SystemExit("GH_TOKEN or GITHUB_TOKEN is required")
    sync(Api(token, os.environ.get("SONAR_TOKEN", "")), repo, args.dry_run)
