import copy
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

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

    def sonar(self, **params):
        if "issues" in params:
            if self.fail_resolution:
                raise RuntimeError("SonarCloud unavailable")
            return {"issues": self.resolved}
        return {"paging": {"total": len(self.active)}, "issues": self.active}

    def request(self, service, path, method="GET", data=None):
        if method == "GET":
            if "/labels?" in path:
                return [{"name": sync.LABEL}]
            return self.tickets
        self.writes.append((method, path, data))
        return {"number": 17}


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
        for state, reason in [("FIXED", "completed"), ("FALSE_POSITIVE", "not_planned"), ("ACCEPTED", "not_planned")]:
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
        api = FakeApi(tickets=[ticket(), ticket()])
        with self.assertRaisesRegex(RuntimeError, "Duplicate"):
            self.run_sync(api)
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


if __name__ == "__main__":
    unittest.main()
