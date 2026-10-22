"""HTTP-boundary tests for the manual, closed-set Sonar root review."""
import copy
from contextlib import redirect_stdout, redirect_stderr
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlsplit

SPEC = importlib.util.spec_from_file_location("root_review", Path(__file__).with_name("review-sonar-root.py"))
reviewer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(reviewer)
SOURCE = b"# Reviewed synthetic fixture\nFROM example\n"


class Response(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


class Sonar:
    """Only HTTP is faked; exercise real auth, query, encoding, and write code."""
    def __init__(self, cases):
        self.cases = cases
        self.calls = []
        self.logged_in = True
        self.failure = None
        self.after_write = None
        self.issues = {case["key"]: dict(
            key=case["key"], project=reviewer.PROJECT, rule=reviewer.RULE,
            component=reviewer.PROJECT + ":" + case["sources"][0]["path"],
            issueStatus="OPEN", transitions=["falsepositive", "wontfix", "accept"],
            actions=["comment"], comments=[], **(
                {"pullRequest": "234"} if "pullRequest" in case["scope"] else {})) for case in cases}
        self.sources = {(tuple(case["scope"].items()), source["path"]): SOURCE
                        for case in cases for source in case["sources"]}

    @property
    def writes(self):
        return [call for call in self.calls if call[0] != "GET"]

    def open(self, request, timeout):
        url = urlsplit(request.full_url)
        method = request.get_method()
        self_check = request.get_header("Authorization") == "Bearer test-secret"
        if not self_check or url.netloc != "sonarcloud.io" or timeout != 30:
            raise AssertionError("Unexpected HTTP boundary")
        if method == "POST" and request.get_header("Content-type") != "application/x-www-form-urlencoded":
            raise AssertionError("Sonar POST must be form-urlencoded")
        params = {key: values[0] for key, values in parse_qs(
            request.data.decode() if request.data is not None else url.query).items()}
        endpoint = url.path.removeprefix("/api/")
        self.calls.append((method, endpoint, params))
        if self.failure:
            self.failure(method, endpoint, params)
        if endpoint == "users/current":
            result = {"isLoggedIn": self.logged_in, "valid": True}
        elif endpoint == "issues/search":
            case = next(case for case in self.cases if case["key"] == params["issues"])
            expected = dict(componentKeys=reviewer.PROJECT, issues=case["key"],
                            additionalFields="transitions,actions,comments", ps="2", **case["scope"])
            if params != expected:
                raise AssertionError("Unexpected search scope")
            result = {"paging": {"total": 1}, "issues": [self.issues[case["key"]]]}
        elif endpoint == "sources/raw":
            scope = {key: params[key] for key in ("branch", "pullRequest") if key in params}
            path = params["key"].removeprefix(reviewer.PROJECT + ":")
            return Response(self.sources[(tuple(scope.items()), path)])
        elif endpoint == "issues/add_comment":
            self.issues[params["issue"]]["comments"].append({"markdown": params["text"]})
            result = {"issue": self.issues[params["issue"]]}
        elif endpoint == "issues/do_transition":
            if params["transition"] not in {"accept", "wontfix"}:
                raise AssertionError("Unapproved transition")
            issue = self.issues[params["issue"]]
            issue.update(issueStatus="ACCEPTED", transitions=[], actions=[])
            result = {"issue": issue}
        else:
            raise AssertionError("Unapproved API endpoint")
        if method != "GET" and self.after_write:
            self.after_write(endpoint, params)
        return Response(json.dumps(result).encode())


class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.cases = copy.deepcopy(reviewer.load_manifest())
        for case in self.cases:
            for source in case["sources"]:
                source["sha256"] = reviewer.source_hash(SOURCE)
        self.http = Sonar(self.cases)
        self.api = reviewer.Api("test-secret", opener=self.http)
        self.manifest_patch = patch.object(reviewer, "load_manifest", return_value=self.cases)
        self.manifest_patch.start()
        self.addCleanup(self.manifest_patch.stop)
        output = redirect_stdout(io.StringIO())
        output.__enter__()
        self.addCleanup(output.__exit__, None, None, None)

    def fails_without_writes(self):
        with self.assertRaises(reviewer.ReviewError):
            reviewer.review(self.api, apply=True)
        self.assertEqual(self.http.writes, [])

    def test_default_dry_run_reads_all_six_and_all_sources(self):
        plan = reviewer.review(self.api)
        self.assertEqual(len(plan), 6)
        self.assertEqual(self.http.writes, [])
        self.assertEqual(sum(call[1] == "sources/raw" for call in self.http.calls), 8)
        self.assertTrue(all(item["transition"] == "accept" for item in plan))

    def test_missing_token_and_anonymous_validation_are_not_authentication(self):
        for token in ("", "  "):
            with self.assertRaises(reviewer.ReviewError):
                reviewer.Api(token, opener=self.http)
        self.http.logged_in = False
        self.fails_without_writes()
        self.assertEqual(len(self.http.calls), 1)

    def test_identity_and_scope_mismatches_in_last_case_prevent_all_writes(self):
        key = self.cases[-1]["key"]
        for field, value in (("key", "new-finding"), ("project", "other"), ("rule", "docker:S9999"),
                             ("component", reviewer.PROJECT + ":other.Dockerfile"),
                             ("pullRequest", "235"), ("branch", "develop")):
            with self.subTest(field=field):
                original = copy.deepcopy(self.http.issues[key])
                self.http.issues[key][field] = value
                self.fails_without_writes()
                self.http.issues[key] = original
        self.http.issues[self.cases[0]["key"]]["pullRequest"] = "234"
        self.fails_without_writes()

    def test_missing_or_duplicate_last_key_prevents_all_writes(self):
        original_open = self.http.open
        for issues, total in (([], 0), ([self.http.issues[self.cases[-1]["key"]]] * 2, 2)):
            def changed_search(request, timeout):
                params = parse_qs(urlsplit(request.full_url).query)
                if params.get("issues") == [self.cases[-1]["key"]]:
                    return Response(json.dumps({"issues": issues, "paging": {"total": total}}).encode())
                return original_open(request, timeout)
            with patch.object(self.http, "open", changed_search):
                self.fails_without_writes()

    def test_changed_dockerfile_or_entrypoint_in_last_case_prevent_all_writes(self):
        scope = tuple(self.cases[-1]["scope"].items())
        for source in self.cases[-1]["sources"]:
            with self.subTest(path=source["path"]):
                self.http.sources[(scope, source["path"])] = SOURCE + b"USER other\n"
                self.fails_without_writes()
                self.http.sources[(scope, source["path"])] = SOURCE

    def test_late_source_and_permission_errors_prevent_all_writes(self):
        for code in (401, 403, 404, 500):
            def fail(method, endpoint, params):
                if endpoint == "sources/raw" and "pullRequest" in params:
                    raise HTTPError("redacted", code, "sensitive body test-secret", {}, None)
            self.http.failure = fail
            self.fails_without_writes()
        self.http.failure = None
        issue = self.http.issues[self.cases[-1]["key"]]
        for field, value in (("transitions", ["falsepositive"]), ("actions", []), ("issueStatus", "UNKNOWN")):
            original = copy.deepcopy(issue)
            issue[field] = value
            self.fails_without_writes()
            issue.clear()
            issue.update(original)

    def test_accept_preferred_legacy_wontfix_fallback_and_rerun_idempotence(self):
        self.http.issues[self.cases[0]["key"]]["transitions"] = ["wontfix"]
        reviewer.review(self.api, apply=True)
        writes = self.http.writes
        self.assertEqual(len(writes), 12)
        self.assertEqual(writes[1][2]["transition"], "wontfix")
        self.assertTrue(all(call[2]["transition"] == "accept" for call in writes[3::2]))
        for case in self.cases:
            comments = self.http.issues[case["key"]]["comments"]
            self.assertEqual(len(comments), 1)
            self.assertIn(reviewer.marker(case), comments[0]["markdown"])
            self.assertIn(reviewer.PR, comments[0]["markdown"])
            self.assertIn(case["reviewed_revision"], comments[0]["markdown"])
        reviewer.review(self.api, apply=True)
        self.assertEqual(len(self.http.writes), 12)

    def test_terminal_cases_skip_without_comment_or_permission(self):
        states = [dict(issueStatus="ACCEPTED"), dict(issueStatus="FIXED"),
                  dict(issueStatus="FALSE_POSITIVE"), dict(issueStatus="CLOSED"),
                  dict(issueStatus="RESOLVED", resolution="WONTFIX")]
        for case, state in zip(self.cases, states):
            self.http.issues[case["key"]].update(**state, transitions=[], actions=[])
        reviewer.review(self.api, apply=True)
        self.assertEqual(len(self.http.writes), 2)
        self.assertEqual(self.http.writes[0][2]["issue"], self.cases[-1]["key"])

    def test_existing_audit_comment_deduplicates_after_partial_run(self):
        case = self.cases[0]
        self.http.issues[case["key"]]["comments"] = [{"markdown": reviewer.audit_comment(case)}]
        reviewer.review(self.api, apply=True)
        self.assertEqual(len(self.http.writes), 11)
        self.assertEqual(self.http.writes[0][1], "issues/do_transition")

    def test_sources_rechecked_between_comment_and_transition(self):
        def change_source(endpoint, params):
            case = self.cases[-1]
            self.http.sources[(tuple(case["scope"].items()), case["sources"][0]["path"])] = b"changed"
        self.http.after_write = change_source
        with self.assertRaises(reviewer.ReviewError):
            reviewer.review(self.api, apply=True)
        self.assertEqual([call[1] for call in self.http.writes], ["issues/add_comment"])

    def test_failed_writes_never_retried_and_errors_are_sanitized(self):
        for endpoint in ("issues/add_comment", "issues/do_transition"):
            for code in (403, 429, 503):
                http = Sonar(self.cases)
                def fail(method, path, params):
                    if method == "POST" and path == endpoint:
                        raise HTTPError("secret-url", code, "test-secret", {"Retry-After": "1"}, None)
                http.failure = fail
                with self.assertRaises(reviewer.ReviewError) as error:
                    reviewer.review(reviewer.Api("test-secret", http), apply=True)
                self.assertNotIn("test-secret", str(error.exception))
                self.assertNotIn("secret-url", str(error.exception))
                self.assertEqual(sum(call[1] == endpoint for call in http.writes), 1)

    def test_ambiguous_committed_comment_can_be_safely_rerun(self):
        def fail_after_comment(endpoint, params):
            raise URLError("sensitive test-secret")
        self.http.after_write = fail_after_comment
        with self.assertRaises(reviewer.ReviewError):
            reviewer.review(self.api, apply=True)
        self.http.after_write = None
        reviewer.review(self.api, apply=True)
        self.assertEqual(len(self.http.issues[self.cases[0]["key"]]["comments"]), 1)
        self.assertEqual(len(self.http.writes), 12)

    def test_transition_must_actually_report_terminal_status(self):
        def remain_open(endpoint, params):
            if endpoint == "issues/do_transition":
                self.http.issues[params["issue"]]["issueStatus"] = "OPEN"
        self.http.after_write = remain_open
        output = io.StringIO()
        with redirect_stdout(output), self.assertRaises(reviewer.ReviewError):
            reviewer.review(self.api, apply=True)
        self.assertNotIn("terminal status confirmed", output.getvalue())
        self.assertEqual(len(self.http.writes), 2)

    def test_readback_must_confirm_terminal_status(self):
        transitioned = False
        def after_write(endpoint, params):
            nonlocal transitioned
            transitioned = endpoint == "issues/do_transition"
        def reopen_before_readback(method, endpoint, params):
            nonlocal transitioned
            if transitioned and endpoint == "users/current":
                transitioned = False
                self.http.issues[self.cases[0]["key"]].update(
                    issueStatus="OPEN", transitions=["accept"], actions=["comment"])
        self.http.after_write = after_write
        self.http.failure = reopen_before_readback
        output = io.StringIO()
        with redirect_stdout(output), self.assertRaises(reviewer.ReviewError):
            reviewer.review(self.api, apply=True)
        self.assertNotIn("terminal status confirmed", output.getvalue())
        self.assertEqual(len(self.http.writes), 2)

    def test_cli_defaults_to_dry_run_and_token_only_from_environment(self):
        with patch.dict("os.environ", {"SONAR_TOKEN": "test-secret"}, clear=True), patch.object(
                reviewer, "Api", return_value=self.api):
            self.assertEqual(reviewer.main([]), 0)
        self.assertEqual(self.http.writes, [])
        with patch.dict("os.environ", {}, clear=True), redirect_stderr(io.StringIO()):
            self.assertEqual(reviewer.main([]), 1)


class ManifestAndTransportTests(unittest.TestCase):
    def test_pinned_manifest_exact_keys_and_scope(self):
        cases = reviewer.load_manifest()
        self.assertEqual({case["key"] for case in cases}, {
            "AaFI-OLnL6mSFxVklHVC", "AaFI-OMJL6mSFxVklHVJ", "AaFI-OLfL6mSFxVklHVB",
            "AaFI-OKkL6mSFxVklHVA", "AaFI-OJvL6mSFxVklHU2", "AaFgfrDLBmL4uU2_jom2"})
        self.assertEqual([case["scope"] for case in cases], [{"branch": "develop"}] * 5 + [{"pullRequest": "234"}])
        with tempfile.TemporaryDirectory() as directory:
            changed = Path(directory) / "manifest.json"
            changed.write_bytes(reviewer.MANIFEST.read_bytes() + b" ")
            with patch.object(reviewer, "MANIFEST", changed), self.assertRaises(reviewer.ReviewError):
                reviewer.load_manifest()

    def test_hash_normalizes_only_crlf_and_terminal_newlines(self):
        self.assertEqual(reviewer.source_hash(b"FROM x\r\n\r\n"), reviewer.source_hash(b"FROM x"))
        self.assertNotEqual(reviewer.source_hash(b"FROM x\n"), reviewer.source_hash(b"FROM  x\n"))

    def test_malformed_json_and_non_object_responses_are_sanitized(self):
        for body in (b"test-secret is not JSON", b"[]"):
            with patch.object(reviewer, "build_opener") as factory:
                factory.return_value.open.return_value = Response(body)
                with self.assertRaises(reviewer.ReviewError) as error:
                    reviewer.Api("test-secret").request("users/current")
                self.assertNotIn("test-secret", str(error.exception))

    def test_redirects_refused(self):
        with self.assertRaises(reviewer.ReviewError):
            reviewer.NoRedirect().redirect_request(None, None, 302, "", {}, "https://other.invalid")


if __name__ == "__main__":
    unittest.main()
