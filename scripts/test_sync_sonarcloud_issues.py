import copy
import importlib.util
import io
from functools import partial
from pathlib import Path
import unittest
from unittest.mock import Mock, patch
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location("sync", Path(__file__).with_name("sync-sonarcloud-issues.py"))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)
REPO = "TheModCraft-TMC/Vessel-HQ"


def finding(key="finding-1", state="OPEN"):
    return {"key": key, "project": sync.PROJECT, "rule": "python:S123", "issueStatus": state,
            "component": sync.PROJECT + ":example.py", "line": 12,
            "impacts": [{"softwareQuality": "RELIABILITY", "severity": "HIGH"}]}


def ticket(item=None, state="open", notes="\n\nMaintainer notes remain here."):
    title, body = sync.content(item or finding())
    return {"number": 17, "title": title, "body": body + notes, "state": state}


class FakeApi:
    def __init__(self, active=(), tickets=(), resolved=()):
        self.active = list(active)
        self.tickets = list(tickets)
        self.resolved = list(resolved)
        self.writes = []
        self.fail_resolution = False
        self.head = "a" * 40
        self.analyses = [{"revision": self.head}]
        self.head_responses = []
        self.analysis_responses = []
        self.reads = []
        self.labels = [{"name": sync.LABEL}]
        self.hooks = {}

    def event(self, name):
        if name in self.hooks:
            self.hooks[name]()

    def advance_head(self, analyzed=False):
        self.head = "b" * 40
        if analyzed:
            self.analyses = [{"revision": self.head}]

    def sonar(self, **params):
        if "issues" in params:
            if self.fail_resolution:
                raise RuntimeError("SonarCloud unavailable")
            return {"issues": self.resolved}
        self.event("findings")
        return {"paging": {"total": len(self.active)}, "issues": self.active}

    def request(self, service, path, method="GET", data=None):
        if method != "GET":
            self.writes.append((method, path, data))
            self.event("write")
            return {"number": 17}
        self.reads.append((service, path))
        if service == "sonar" and path.startswith("/api/project_analyses/search?"):
            self.event("analysis")
            return self.analysis_responses.pop(0) if self.analysis_responses else {"analyses": self.analyses}
        if service == "github" and path == f"/repos/{REPO}/commits/{sync.BRANCH}":
            self.event("head")
            return {"sha": self.head_responses.pop(0) if self.head_responses else self.head}
        if service == "github" and "/labels?" in path:
            self.event("labels")
            return self.labels
        if service == "github" and "/issues?" in path:
            self.event("tickets")
            return self.tickets
        raise AssertionError(f"Unexpected read: {service} {path}")


class Clock:
    def __init__(self):
        self.now = 0
        self.sleeps = []

    def monotonic(self):
        return self.now

    def sleep(self, seconds):
        self.sleeps.append(seconds)
        self.now += seconds


class SyncTests(unittest.TestCase):
    def run_sync(self, api, dry_run=False):
        with patch.object(sync.time, "sleep"):
            return sync.sync(api, REPO, dry_run)

    def test_create_and_idempotent_second_run(self):
        api = FakeApi(active=[finding()])
        self.assertEqual(self.run_sync(api)["create"], 1)
        payload = api.writes[0][2]
        self.assertIn(sync.marker("finding-1"), payload["body"])
        self.assertEqual(payload["labels"], [sync.LABEL])
        api = FakeApi(active=[finding()], tickets=[ticket(notes="\n\n")])
        self.assertEqual(self.run_sync(api)["update_or_close"], 0)
        self.assertEqual(api.writes, [])

    def test_notes_survive_update_and_reopen(self):
        changed = finding()
        changed["line"] = 99
        api = FakeApi(active=[changed], tickets=[ticket(state="closed")])
        self.run_sync(api)
        payload = api.writes[0][2]
        self.assertEqual(payload["state"], "open")
        self.assertIn("example.py:99", payload["body"])
        self.assertTrue(payload["body"].endswith("Maintainer notes remain here."))

    def test_explicit_resolution_closes_with_correct_reason(self):
        for state, reason in [("FIXED", "completed"), ("FALSE_POSITIVE", "not_planned"),
                              ("ACCEPTED", "not_planned"), ("CLOSED", "completed")]:
            with self.subTest(state=state):
                api = FakeApi(tickets=[ticket()], resolved=[finding(state=state)])
                self.run_sync(api)
                self.assertEqual(api.writes[0][2]["state"], "closed")
                self.assertEqual(api.writes[0][2]["state_reason"], reason)

    def test_absent_findings_never_imply_resolution(self):
        api = FakeApi(tickets=[ticket()])
        self.run_sync(api)
        self.assertEqual(api.writes, [])

    def test_unrelated_project_or_branch_is_untouched(self):
        unrelated = ticket()
        unrelated["body"] = unrelated["body"].replace(":develop:", ":other-branch:")
        api = FakeApi(tickets=[unrelated])
        self.run_sync(api)
        self.assertEqual(api.writes, [])

    def test_all_reads_finish_before_writes(self):
        api = FakeApi(active=[finding("new")], tickets=[ticket()])
        api.fail_resolution = True
        with self.assertRaises(RuntimeError):
            self.run_sync(api)
        self.assertEqual(api.writes, [])

    def test_duplicate_managed_tickets_abort(self):
        older, newer = ticket(), ticket()
        older["number"], newer["number"] = 166, 240
        api = FakeApi(tickets=[older, newer])
        with self.assertRaisesRegex(RuntimeError, "Duplicate open.*#166.*#240"):
            self.run_sync(api)
        self.assertEqual(api.writes, [])

    def test_closed_duplicates_preserve_latest_not_planned_disposition(self):
        # Production failure: #166 (completed) and #240 (not_planned) share
        # one finding marker. Neither archived issue should be reopened.
        older, newer = ticket(state="closed"), ticket(state="closed")
        older.update(number=166, state_reason="completed")
        newer.update(number=240, state_reason="not_planned")
        for tickets in ([older, newer], [newer, older]):
            with self.subTest(order=[t["number"] for t in tickets]):
                api = FakeApi(active=[finding(), finding("new")], tickets=tickets)
                summary = self.run_sync(api)
                self.assertEqual(summary["create"], 1)
                self.assertEqual(summary["update_or_close"], 0)
                self.assertEqual(summary["preserved_not_planned"], [240])
                self.assertEqual(summary["historical_duplicates"], [{"canonical": 240, "closed": [166]}])
                self.assertEqual(len(api.writes), 1)
                self.assertEqual(api.writes[0][0], "POST")
                self.assertIn(sync.marker("new"), api.writes[0][2]["body"])

    def test_closed_duplicates_reopen_latest_completed_issue_only(self):
        older, newer = ticket(state="closed"), ticket(state="closed")
        older.update(number=166, state_reason="completed")
        newer.update(number=240, state_reason="completed")
        for tickets in ([older, newer], [newer, older]):
            with self.subTest(order=[t["number"] for t in tickets]):
                api = FakeApi(active=[finding()], tickets=tickets)
                self.run_sync(api)
                self.assertEqual(len(api.writes), 1)
                self.assertEqual(api.writes[0][1], f"/repos/{REPO}/issues/240")
                self.assertEqual(api.writes[0][2]["state"], "open")

    def test_single_open_issue_wins_over_closed_duplicates_and_keeps_notes(self):
        current = ticket(notes="\n\nOpen issue's maintainer notes.")
        current["number"] = 166
        archived = ticket(state="closed")
        archived.update(number=240, state_reason="completed")
        changed = finding()
        changed["line"] = 99
        for tickets in ([current, archived], [archived, current]):
            with self.subTest(order=[t["number"] for t in tickets]):
                api = FakeApi(active=[changed], tickets=tickets)
                self.run_sync(api)
                self.assertEqual(len(api.writes), 1)
                self.assertEqual(api.writes[0][1], f"/repos/{REPO}/issues/166")
                self.assertTrue(api.writes[0][2]["body"].endswith("Open issue's maintainer notes."))

    def test_duplicate_groups_are_resolved_after_all_github_pages_are_read(self):
        older, newer = ticket(state="closed"), ticket(state="closed")
        older.update(number=166, state_reason="completed")
        newer.update(number=240, state_reason="not_planned")
        api = FakeApi(active=[finding()])
        original_request = api.request

        def paginated_request(service, path, method="GET", data=None):
            if service == "github" and "/issues?" in path:
                if path.endswith("&page=1"):
                    return [older] + [{"number": n, "body": "", "state": "closed"} for n in range(1000, 1099)]
                return [newer]
            return original_request(service, path, method, data)

        api.request = paginated_request
        summary = self.run_sync(api, dry_run=True)
        self.assertEqual(summary["preserved_not_planned"], [240])
        self.assertEqual(api.writes, [])

    def test_single_not_planned_issue_is_preserved_without_duplicating_or_updating(self):
        current = ticket(state="closed")
        current["state_reason"] = "not_planned"
        changed = finding()
        changed["line"] = 99
        api = FakeApi(active=[changed], tickets=[current])
        summary = self.run_sync(api)
        self.assertEqual(summary["preserved_not_planned"], [17])
        self.assertEqual(summary["create"], 0)
        self.assertEqual(summary["update_or_close"], 0)
        self.assertEqual(api.writes, [])

    def test_dry_run_never_writes(self):
        api = FakeApi(active=[finding()])
        self.assertEqual(self.run_sync(api, True)["create"], 1)
        self.assertEqual(api.writes, [])

    def test_incomplete_or_duplicate_source_results_abort(self):
        api = FakeApi(active=[finding()])
        api.sonar = lambda **params: {"paging": {"total": 2}, "issues": [finding(), finding()]}
        with self.assertRaises(RuntimeError):
            self.run_sync(api)
        self.assertEqual(api.writes, [])

    def test_source_pagination(self):
        api = FakeApi()
        first = [finding(f"key-{i}") for i in range(500)]
        second = [finding("last")]
        pages = iter([first, second])
        api.sonar = lambda **params: {"paging": {"total": 501}, "issues": next(pages)}
        self.assertEqual(len(sync.fetch_active(api)), 501)

    def test_malformed_managed_region_aborts_before_writes(self):
        current = ticket()
        current["body"] = current["body"].replace(sync.END, "")
        api = FakeApi(active=[finding()], tickets=[current])
        with self.assertRaisesRegex(RuntimeError, "malformed"):
            self.run_sync(api)
        self.assertEqual(api.writes, [])


class RetryDelayTests(unittest.TestCase):
    def test_seconds_and_http_date_formats(self):
        headers = [
            "120",
            "Thu, 01 Jan 2026 00:02:00 GMT",
            "Thursday, 01-Jan-26 00:02:00 GMT",
            "Thu Jan  1 00:02:00 2026",
        ]
        with patch.object(sync.time, "time", return_value=1767225600):
            for header in headers:
                with self.subTest(header=header):
                    self.assertEqual(sync.retry_delay(header), 120)

    def test_missing_malformed_and_expired_headers_keep_minimum_backoff(self):
        headers = [None, "", "later", "-5", "1", "Wed, 31 Dec 2025 23:59:00 GMT"]
        with patch.object(sync.time, "time", return_value=1767225600):
            for header in headers:
                with self.subTest(header=header):
                    self.assertEqual(sync.retry_delay(header), 60)


class ApiRetryTests(unittest.TestCase):
    # Exercise the real HTTP retry layer, which FakeApi bypasses. A
    # rate-limit backoff must not retry a mutation outside sync's head guard.
    def test_rate_limited_writes_fail_without_retrying_an_obsolete_plan(self):
        for method in ("POST", "PATCH"):
            for code in (403, 429, 500):
                with self.subTest(method=method, code=code):
                    error = HTTPError("https://api.github.com/test", code, "limited", {"Retry-After": "60"}, None)
                    with patch.object(sync, "urlopen", side_effect=[error, io.BytesIO(b'{}')]) as request:
                        with patch.object(sync.time, "sleep") as sleep:
                            with self.assertRaisesRegex(RuntimeError, f"HTTP {code}"):
                                sync.Api("test-token").request("github", "/test", method, {"state": "open"})
                    self.assertEqual(request.call_count, 1)
                    sleep.assert_not_called()

    def test_safe_reads_still_retry_transient_errors(self):
        headers = [("60", 60), ("Thu, 01 Jan 2026 00:02:00 GMT", 120)]
        with patch.object(sync.time, "time", return_value=1767225600):
            for code in (403, 429, 500):
                for header, delay in headers:
                    with self.subTest(code=code, header=header):
                        error = HTTPError("https://api.github.com/test", code, "limited", {"Retry-After": header}, None)
                        with patch.object(sync, "urlopen", side_effect=[error, io.BytesIO(b'{"sha":"fresh"}')]) as request:
                            with patch.object(sync.time, "sleep") as sleep:
                                result = sync.Api("test-token").request("github", "/test")
                        self.assertEqual(result, {"sha": "fresh"})
                        self.assertEqual(request.call_count, 2)
                        sleep.assert_called_once_with(delay)


class FreshnessTests(unittest.TestCase):
    def run_sync(self, api, dry_run=False, clock=None):
        clock = clock or Clock()
        with patch.object(sync.time, "monotonic", clock.monotonic), patch.object(sync.time, "sleep", clock.sleep):
            return sync.sync(api, REPO, dry_run)

    def assert_abort(self, api, message, writes=0, **kwargs):
        with self.assertRaisesRegex(RuntimeError, message):
            self.run_sync(api, **kwargs)
        self.assertEqual(len(api.writes), writes)

    def test_stale_then_fresh_waits_before_planning_and_reopens(self):
        api = FakeApi(active=[finding()], tickets=[ticket(state="closed")])
        api.analysis_responses = [{"analyses": [{"revision": "old"}]}] * 2
        clock = Clock()

        def check_planning_time():
            self.assertEqual(clock.now, 60)
            self.assertEqual(api.writes, [])

        api.hooks["findings"] = check_planning_time
        self.run_sync(api, clock=clock)
        self.assertEqual(clock.sleeps[:2], [30, 30])
        self.assertEqual(api.writes[0][2]["state"], "open")

    def test_stale_or_missing_metadata_times_out_without_even_planning(self):
        for analyses in [[{"revision": "old"}], [], [{}], [{"revision": ""}], [{"revision": None}]]:
            with self.subTest(analyses=analyses):
                api = FakeApi(active=[finding()], tickets=[ticket(state="closed")])
                api.analyses = analyses
                clock = Clock()
                with patch.object(api, "sonar") as findings_read:
                    self.assert_abort(api, "missing a revision or behind", clock=clock)
                findings_read.assert_not_called()
                self.assertEqual(clock.now, 600)
                self.assertEqual(clock.sleeps, [30] * 20)

    def test_missing_github_head_never_writes(self):
        for head in [None, "", 123]:
            with self.subTest(head=head):
                api = FakeApi(active=[finding()])
                api.head = head
                self.assert_abort(api, "missing a revision or behind")

    def test_only_latest_analysis_can_authorize_writes(self):
        api = FakeApi(active=[finding()])
        api.analyses = [{"revision": "old"}, {"revision": api.head}]
        self.assert_abort(api, "missing a revision or behind")

    def test_poll_sleep_is_capped_by_remaining_budget(self):
        api = FakeApi()
        api.analyses = []
        clock = Clock()
        with patch.object(sync.time, "monotonic", clock.monotonic), patch.object(sync.time, "sleep", clock.sleep):
            with self.assertRaises(RuntimeError):
                sync.wait_for_fresh_analysis(api, REPO, timeout=31)
        self.assertEqual(clock.sleeps, [30, 1])

    def test_head_advances_during_initial_analysis_read(self):
        api = FakeApi(active=[finding()])
        old = api.head
        api.advance_head(analyzed=True)
        api.head_responses = [old, api.head]
        api.analysis_responses = [{"analyses": [{"revision": old}]}]
        clock = Clock()
        self.run_sync(api, clock=clock)
        self.assertEqual(clock.sleeps[0], 30)
        self.assertEqual(len(api.writes), 1)

    def test_planning_recheck_rejects_new_head_even_if_new_analysis_is_fresh(self):
        for analysis_catches_up in [False, True]:
            with self.subTest(analysis_catches_up=analysis_catches_up):
                api = FakeApi(active=[finding()], tickets=[ticket(state="closed")])
                api.hooks["findings"] = partial(api.advance_head, analyzed=analysis_catches_up)
                self.assert_abort(api, "changed during planning")

    def test_planning_recheck_rejects_missing_or_changed_analysis(self):
        for analyses in [[], [{}], [{"revision": "old"}]]:
            with self.subTest(analyses=analyses):
                api = FakeApi(active=[finding()])
                api.analysis_responses = [{"analyses": api.analyses}, {"analyses": analyses}]
                self.assert_abort(api, "changed during planning")

    def test_api_errors_at_every_read_stage_never_write(self):
        # Head reads: two in preflight, two after planning, one before the issue write.
        cases = [("head", n) for n in range(5)] + [("analysis", n) for n in range(2)]
        cases += [(stage, 0) for stage in ("findings", "tickets", "labels")]
        for stage, successful_reads in cases:
            with self.subTest(stage=stage, successful_reads=successful_reads):
                api = FakeApi(active=[finding()])
                api.hooks[stage] = Mock(side_effect=[None] * successful_reads + [RuntimeError("API unavailable")])
                self.assert_abort(api, "API unavailable")

    def test_checks_live_branch_not_workflow_sha(self):
        api = FakeApi(active=[finding()])
        with patch.dict(sync.os.environ, {"GITHUB_SHA": "other", "GITHUB_REF": "refs/heads/other"}):
            self.run_sync(api)
        analysis_paths = [path for service, path in api.reads if service == "sonar"]
        self.assertTrue(all("branch=develop" in path and "ps=1" in path for path in analysis_paths))
        self.assertEqual(len(api.writes), 1)

    def test_dry_run_still_checks_freshness_without_mutations(self):
        api = FakeApi(active=[finding()])
        self.assertEqual(self.run_sync(api, True)["create"], 1)
        self.assertEqual(len([p for _, p in api.reads if "/project_analyses/" in p]), 2)
        self.assertEqual(api.writes, [])
        api.analyses = []
        self.assert_abort(api, "missing a revision or behind", dry_run=True)

    def test_head_change_after_label_read_prevents_label_and_issue_creation(self):
        for label_exists in [False, True]:
            with self.subTest(label_exists=label_exists):
                api = FakeApi(active=[finding()])
                if not label_exists:
                    api.labels = []
                api.hooks["labels"] = api.advance_head
                self.assert_abort(api, "changed during sync")

    def test_head_change_during_batch_stops_next_write_including_after_label_creation(self):
        for create_label in [False, True]:
            with self.subTest(create_label=create_label):
                api = FakeApi(active=[finding("one"), finding("two")])
                if create_label:
                    api.labels = []
                api.hooks["write"] = api.advance_head
                self.assert_abort(api, "changed during sync", writes=1)
                self.assertTrue(api.writes[0][1].endswith("/labels" if create_label else "/issues"))


if __name__ == "__main__":
    unittest.main()
