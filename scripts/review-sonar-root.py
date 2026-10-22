#!/usr/bin/env python3
"""Manually record six already-reviewed PR234 root cases; dry-run unless --apply."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

PROJECT = "TheModCraft-TMC_Vessel-HQ"
RULE = "docker:S6471"
MANIFEST = Path(__file__).with_name("sonar-root-review.json")
# Refresh only after a human reviews changed sources and the six-case manifest.
MANIFEST_SHA256 = "8a8fd5a5f64316dfa035e794af3b580e88b20ecd14f1412ed78d5840477ddd05"
LEDGER = "https://github.com/TheModCraft-TMC/Vessel-HQ/blob/2d88f8851b47b86f2afb4c1ec6937dd714f97bd8/docs/planning/github-issue-remediation.md#sonarcloud-review-access"
PR = "https://github.com/TheModCraft-TMC/Vessel-HQ/pull/234"


class ReviewError(Exception):
    """Safe-to-print operator error; never include response bodies or tokens."""


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ReviewError("SonarCloud redirect refused")


class Api:
    def __init__(self, token, opener=None):
        if not token or not token.strip():
            raise ReviewError("SONAR_TOKEN is required (environment only)")
        self.token = token
        self.opener = opener or build_opener(NoRedirect())

    def request(self, endpoint, params=None, method="GET", raw=False):
        url = "https://sonarcloud.io/api/" + endpoint
        headers = {"Authorization": "Bearer " + self.token,
                   "Accept": "text/plain" if raw else "application/json"}
        body = None
        if method == "GET":
            url += "?" + urlencode(params or {})
        else:
            body = urlencode(params or {}).encode("utf-8")
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        # No retries, especially not writes: outer preflight must run again.
        try:
            request = Request(url, data=body, headers=headers, method=method)
            with self.opener.open(request, timeout=30) as response:
                data = response.read()
            if raw:
                return data
            result = json.loads(data)
            if not isinstance(result, dict):
                raise ReviewError("SonarCloud response must be a JSON object")
            return result
        except HTTPError as error:
            raise ReviewError(f"SonarCloud {method} failed: HTTP {error.code}; stopped, inspect before rerun") from None
        except (URLError, TimeoutError, OSError, ValueError):
            raise ReviewError(f"SonarCloud {method} transport/response error; stopped, inspect before rerun") from None


def source_hash(data):
    # Normalize CRLF and terminal newlines only, never comments/whitespace/code.
    normalized = data.replace(b"\r\n", b"\n").rstrip(b"\n") + b"\n"
    return hashlib.sha256(normalized).hexdigest()


def load_manifest():
    data = MANIFEST.read_bytes()
    if hashlib.sha256(data).hexdigest() != MANIFEST_SHA256:
        raise ReviewError("Review manifest changed; human source review and repinning required")
    manifest = json.loads(data)
    if manifest["project"] != PROJECT or manifest["rule"] != RULE or len(manifest["cases"]) != 6:
        raise ReviewError("Unexpected review manifest scope")
    return manifest["cases"]


def marker(case):
    return f"[vessel-root-review:pr234:v1:{case['key']}]"


def terminal(issue):
    state = issue.get("issueStatus") or issue.get("status")
    return state in {"ACCEPTED", "FIXED", "FALSE_POSITIVE", "CLOSED"} or (
        state == "RESOLVED" and issue.get("resolution") in {"WONTFIX", "FIXED", "FALSE-POSITIVE"})


def fetch_issue(api, case):
    scope = case["scope"]
    data = api.request("issues/search", dict(componentKeys=PROJECT, issues=case["key"],
                       additionalFields="transitions,actions,comments", ps=2, **scope))
    issues = data.get("issues", [])
    if data.get("paging", {}).get("total") != 1 or len(issues) != 1:
        raise ReviewError("Expected exactly one finding for " + case["key"])
    issue = issues[0]
    component = PROJECT + ":" + case["sources"][0]["path"]
    if (issue.get("key") != case["key"] or issue.get("project") != PROJECT
            or issue.get("rule") != RULE or issue.get("component") != component):
        raise ReviewError("Finding identity mismatch for " + case["key"])
    # Branch findings omit branch in Sonar's response; the explicit scoped query
    # is authoritative. Reject conflicting scope fields rather than falling back.
    if (issue.get("pullRequest") != scope.get("pullRequest")
            or issue.get("branch", scope.get("branch")) != scope.get("branch")):
        raise ReviewError("Finding scope mismatch for " + case["key"])
    return issue


def inspect_case(api, case):
    issue = fetch_issue(api, case)
    for source in case["sources"]:
        raw = api.request("sources/raw", dict(key=PROJECT + ":" + source["path"], **case["scope"]), raw=True)
        if source_hash(raw) != source["sha256"]:
            raise ReviewError("Reviewed source changed for " + case["key"] + ": " + source["path"])
    if terminal(issue):
        return {"key": case["key"], "transition": None, "commented": False}
    if (issue.get("issueStatus") or issue.get("status")) not in {"OPEN", "CONFIRMED", "REOPENED"}:
        raise ReviewError("Unrecognized finding state for " + case["key"])
    transitions = issue.get("transitions", [])
    transition = next((value for value in ("accept", "wontfix") if value in transitions), None)
    commented = any(marker(case) in comment.get("markdown", "") for comment in issue.get("comments", []))
    if not transition or (not commented and "comment" not in issue.get("actions", [])):
        raise ReviewError("Token lacks authorized accept/comment actions for " + case["key"])
    return {"key": case["key"], "transition": transition, "commented": commented}


def preflight(api, cases):
    # authentication/validate may say valid=true for anonymous users. Do not use it.
    if api.request("users/current").get("isLoggedIn") is not True:
        raise ReviewError("SonarCloud did not confirm an authenticated user")
    return [inspect_case(api, case) for case in cases]


def audit_comment(case):
    hashes = ", ".join(source["path"] + " sha256=" + source["sha256"] for source in case["sources"])
    return (f"{marker(case)}\nAuthorized manual recording of the intentional root review for {RULE}. "
            f"{case['rationale']}\nPR: {PR}\nReview ledger: {LEDGER}\n"
            f"GitHub case: https://github.com/TheModCraft-TMC/Vessel-HQ/issues/{case['github_issue']}\n"
            f"Reviewed source revision: {case['reviewed_revision']}\n"
            f"Line-normalized reviewed sources: {hashes}\n"
            "This comment records the rationale, not proof that a transition or quality gate succeeded.")


def review(api, apply=False):
    cases = load_manifest()
    plan = preflight(api, cases)  # All six MUST pass before any mutation.
    print(json.dumps({"dry_run": not apply, "cases": plan}), flush=True)
    if apply:
        for index, case in enumerate(cases):
            record_case(api, cases, index, case)
    return plan


def record_case(api, cases, index, case):
    # Fresh all-case preflight immediately before every POST. No internal
    # retry/backoff can bypass these source/scope/permission guards.
    current = preflight(api, cases)[index]
    if not current["transition"]:
        return
    if not current["commented"]:
        api.request("issues/add_comment", {"issue": case["key"], "text": audit_comment(case)}, "POST")
        current = preflight(api, cases)[index]
        if not current["transition"]:
            return
        if not current["commented"]:
            raise ReviewError("Audit comment not visible; stopped before transition")
    result = api.request("issues/do_transition", {"issue": case["key"],
                         "transition": current["transition"]}, "POST")
    if result.get("issue", {}).get("key") != case["key"] or not terminal(result.get("issue", {})):
        raise ReviewError("Transition response not terminal; inspect remotely before rerun")
    confirmed = preflight(api, cases)[index]
    if confirmed["transition"]:
        raise ReviewError("Transition not confirmed by readback; inspect remotely before rerun")
    print("SonarCloud terminal status confirmed: " + case["key"], flush=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Explicitly record the six authorized reviews")
    args = parser.parse_args(argv)
    try:
        review(Api(os.environ.get("SONAR_TOKEN", "")), apply=args.apply)
    except ReviewError as error:
        print(str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
