"""Safety/transport unit tests. No Docker daemon, browser, or cloud calls."""
import argparse
import contextlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

import platform_smoke as smoke


class PlatformSmokeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.binary = Path(self.tmp.name) / "binary"
        self.binary.write_bytes(b"test-artifact")
        self.args = argparse.Namespace(binary=str(self.binary), runtime_image="test-runtime:local", kind="kind")
        self.runner = smoke.Smoke(self.args)

    def tearDown(self):
        # Tests mock the resource operations, so do not run real Docker cleanup.
        self.runner.tmp.cleanup()
        self.tmp.cleanup()

    def test_unique_owned_prefix_and_artifact_identity(self):
        self.assertTrue(self.runner.prefix.startswith(smoke.PREFIX))
        self.assertEqual(len(self.runner.results["binary_sha256"]), 64)
        other = smoke.Smoke(self.args)
        try:
            self.assertNotEqual(self.runner.prefix, other.prefix)
        finally:
            other.tmp.cleanup()

    def test_subprocess_errors_never_include_argv_credentials(self):
        failed = subprocess.CompletedProcess([], 1, "", "provider unavailable")
        with patch.object(smoke.subprocess, "run", return_value=failed):
            with self.assertRaisesRegex(RuntimeError, "provider unavailable") as error:
                smoke.command("tool", "--password=do-not-print")
        self.assertNotIn("do-not-print", str(error.exception))

    def test_failed_container_start_attempts_only_its_own_cleanup(self):
        with patch.object(self.runner, "docker", side_effect=[RuntimeError("start failed"), ""]) as docker:
            with self.assertRaisesRegex(RuntimeError, "start failed"):
                self.runner.run("fixture", "test:image")
        self.assertEqual(docker.call_args_list[1].args, ("rm", "-fv", self.runner.prefix + "-fixture"))
        self.assertEqual(self.runner.containers, [])

    def test_all_container_starts_are_bounded_and_owned(self):
        with patch.object(self.runner, "docker", side_effect=["container-id", '["test@sha256:abc"]']) as docker:
            name = self.runner.run("fixture", "test:image")
        args = docker.call_args_list[0].args
        self.assertEqual(name, self.runner.prefix + "-fixture")
        self.assertIn("768m", args)
        self.assertIn("--cpus", args)
        self.assertIn("vessel.platform-smoke=" + self.runner.prefix, args)
        self.assertEqual(self.runner.results["images"]["test:image"], ["test@sha256:abc"])

    def test_named_volumes_and_networks_use_the_run_prefix(self):
        with patch.object(self.runner, "docker", return_value="") as docker:
            network = self.runner.new_network("network")
            volume = self.runner.new_volume("data")
        for call in docker.call_args_list:
            self.assertTrue(call.args[-1].startswith(self.runner.prefix + "-"))
        self.assertEqual(self.runner.networks, [network])
        self.assertEqual(self.runner.volumes, [volume])

    def test_cleanup_never_enumerates_or_prunes_shared_resources(self):
        owned = self.runner.prefix + "-container"
        network = self.runner.prefix + "-network"
        volume = self.runner.prefix + "-volume"
        self.runner.containers = [owned]
        self.runner.networks = [network]
        self.runner.volumes = [volume]
        with patch.object(self.runner, "docker", return_value="") as docker:
            self.assertEqual(self.runner.release_resources(), [])
        self.assertEqual([call.args for call in docker.call_args_list], [
            ("rm", "-fv", owned), ("network", "rm", network), ("volume", "rm", volume)])
        self.assertEqual(self.runner.containers + self.runner.networks + self.runner.volumes, [])

    def test_cleanup_records_failure_without_removing_other_resources(self):
        name = self.runner.prefix + "-container"
        self.runner.containers = [name]
        with patch.object(self.runner, "docker", side_effect=RuntimeError("busy")):
            self.assertEqual(self.runner.release_resources(), [name])
        self.assertEqual(self.runner.containers, [name])

    def test_wait_handles_transient_connection_resets(self):
        fn = MagicMock(side_effect=[ConnectionResetError("booting"), {"ready": True}])
        with patch.object(smoke.time, "sleep"):
            self.assertEqual(smoke.wait_for(fn), {"ready": True})

    def response(self, body, status=200):
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = status
        response.read.return_value = json.dumps(body).encode()
        return response

    def test_authenticated_request_and_multipart_endpoint_payload(self):
        self.runner.base = "http://127.0.0.1:12345"
        self.runner.token = "ephemeral-test-token"
        with patch.object(smoke.urllib.request, "urlopen", return_value=self.response({"Id": 7})) as urlopen:
            endpoint = self.runner.endpoint("test", "tcp://127.0.0.1:2375")
        self.assertEqual(endpoint, 7)
        request = urlopen.call_args.args[0]
        self.assertEqual(request.get_header("Authorization"), "Bearer ephemeral-test-token")
        self.assertIn(b"EndpointCreationType", request.data)
        self.assertIn(b"tcp://127.0.0.1:2375", request.data)

    def test_expected_http_errors_are_checked_not_swallowed(self):
        self.runner.base = "http://127.0.0.1:12345"
        error = urllib.error.HTTPError("url", 404, "missing", {}, io.BytesIO(b'{"message":"missing"}'))
        with patch.object(smoke.urllib.request, "urlopen", side_effect=error):
            self.assertEqual(self.runner.request("GET", "/missing", expected=404), {"message": "missing"})
        with patch.object(smoke.urllib.request, "urlopen", return_value=self.response({}, 200)):
            with self.assertRaisesRegex(RuntimeError, "HTTP 200"):
                self.runner.request("GET", "/missing", expected=404)

    def test_missing_azure_access_is_an_explicit_gate_not_a_mock_pass(self):
        with patch.object(smoke.shutil, "which", return_value=None), patch.dict(smoke.os.environ, {}, clear=True), patch.object(smoke, "command") as command:
            with self.assertRaises(smoke.ExternalGate):
                self.runner.suite_aci()
        command.assert_not_called()
        self.assertEqual(self.runner.results["aci_gate"], {"azure_cli_installed": False, "azure_environment_names_present": []})

    def test_frontend_artifact_is_copied_and_only_disposable_metadata_is_rewritten(self):
        source = Path(self.tmp.name) / "source" / "web-src" / ".next" / "standalone"
        metadata = source / "web-src" / ".next"
        metadata.mkdir(parents=True)
        server = source / "web-src" / "server.js"
        server.write_text("const origin = 'http://localhost:9000';")
        for name in ("routes-manifest.json", "required-server-files.json"):
            (metadata / name).write_text('{"origin":"http://localhost:9000"}')
        (metadata / "BUILD_ID").write_text("test-build-id")
        (source.parent / "static").mkdir()
        (source.parent.parent / "public").mkdir()
        self.args.frontend_standalone = str(source)
        self.runner.base = "http://127.0.0.1:14567"
        with patch.object(smoke.subprocess, "Popen") as popen, patch.object(smoke, "wait_for"):
            self.assertEqual(self.runner.start_frontend(14568), "http://127.0.0.1:14568")
        self.assertIn("http://localhost:9000", server.read_text())
        copy = self.runner.root / "frontend" / "web-src"
        self.assertIn(self.runner.base, (copy / "server.js").read_text())
        self.assertIn(self.runner.base, (copy / ".next" / "routes-manifest.json").read_text())
        self.assertEqual(popen.call_args.kwargs["env"]["PORTAINER_API_ORIGIN"], self.runner.base)
        self.assertEqual(popen.call_args.kwargs["env"]["HOSTNAME"], "127.0.0.1")
        self.assertEqual(self.runner.results["frontend"]["build_id"], "test-build-id")

    def test_external_gate_is_recorded_as_blocked_with_distinct_exit_code(self):
        self.args.suites = "aci"
        self.args.output = str(Path(self.tmp.name) / "result.json")
        with patch.object(self.runner, "suite_aci", side_effect=smoke.ExternalGate("account unavailable")), patch.object(self.runner, "release_resources", return_value=[]), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(self.runner.execute(), 2)
        result = json.loads(Path(self.args.output).read_text())
        self.assertEqual(result["suites"]["aci"]["status"], "blocked")
        self.assertEqual(result["cleanup_failures"], [])

    def test_existing_azure_metadata_check_never_logs_in_or_creates_resources(self):
        with patch.object(smoke.shutil, "which", return_value="/tmp/az"), patch.dict(smoke.os.environ, {}, clear=True), patch.object(smoke, "command", return_value='{"state":"Enabled"}') as command:
            with self.assertRaises(smoke.ExternalGate):
                self.runner.suite_aci()
        self.assertEqual(command.call_args.args, ("/tmp/az", "account", "show", "--query", "{state:state}", "-o", "json"))


if __name__ == "__main__":
    unittest.main()
