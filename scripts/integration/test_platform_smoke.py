"""Safety/transport unit tests. No Docker daemon, browser, or cloud calls."""
import argparse
import contextlib
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

import platform_smoke as smoke


class PlatformSmokeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.binary = Path(self.tmp.name) / "binary"
        self.binary.write_bytes(smoke.ELF_MAGIC + b"test-artifact")
        self.args = argparse.Namespace(binary=str(self.binary), runtime_image="test-runtime:local", kind="kind", expected_release="1.3.1", expected_datastore="2.45.0")
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

    def test_binary_cli_read_accepts_external_relative_and_symlink_artifacts_without_source_writes(self):
        # Trusted build artifacts need not live under the repository. A link or
        # '..' is valid input, not a write traversal into an artifact directory.
        alias = Path(self.tmp.name) / "artifact-link"
        alias.symlink_to(self.binary)
        child = Path(self.tmp.name) / "build"
        child.mkdir()
        expected = self.binary.read_bytes()
        for path in (self.binary, alias, child / ".." / "binary"):
            with self.subTest(path=path):
                self.args.binary = str(path)
                runner = smoke.Smoke(self.args)
                try:
                    self.assertEqual(runner.binary.read_bytes(), expected)
                    self.assertFalse(runner.binary.is_symlink())
                    self.assertNotEqual(runner.binary.stat().st_ino, self.binary.stat().st_ino)
                    self.assertEqual(self.binary.read_bytes(), expected)
                finally:
                    runner.tmp.cleanup()

    def test_non_elf_binary_is_rejected_before_copy_and_removes_only_its_private_tempdir(self):
        secret = Path(self.tmp.name) / "not-a-binary.env"
        secret.write_bytes(b"TOKEN=synthetic-secret\n")
        args = argparse.Namespace(**{**vars(self.args), "binary": str(secret)})
        owned = tempfile.TemporaryDirectory(prefix="rejected-snapshot-", dir=self.tmp.name)
        owned_root = Path(owned.name)
        with patch.object(smoke.tempfile, "TemporaryDirectory", return_value=owned), patch.object(smoke.shutil, "copyfileobj") as copy:
            with self.assertRaisesRegex(ValueError, "not an ELF executable") as error:
                smoke.Smoke(args)
        copy.assert_not_called()
        self.assertFalse(owned_root.exists())
        self.assertTrue(self.runner.root.exists())
        self.assertEqual(secret.read_bytes(), b"TOKEN=synthetic-secret\n")
        self.assertNotIn("synthetic-secret", str(error.exception))

    def test_backend_snapshot_survives_atomic_source_replacement_and_is_the_mount(self):
        expected = self.binary.read_bytes()
        replacement = Path(self.tmp.name) / "replacement"
        replacement.write_bytes(smoke.ELF_MAGIC + b"different-build")
        replacement.replace(self.binary)
        self.assertEqual(self.runner.binary.read_bytes(), expected)
        self.assertEqual(self.runner.results["binary_sha256"], hashlib.sha256(expected).hexdigest())
        self.assertNotEqual(self.binary.read_bytes(), expected)
        with patch.object(self.runner, "run", return_value="owned-vessel") as run, patch.object(self.runner, "docker", return_value="127.0.0.1:14567"), patch.object(self.runner, "initialize_session"):
            self.runner.start_vessel(namespace=self.runner.prefix + "-namespace")
        options = run.call_args.args[3]
        self.assertIn(f"type=bind,source={self.runner.binary},target=/vessel/portainer,readonly", options)
        self.assertNotIn(f"type=bind,source={self.binary},target=/vessel/portainer,readonly", options)
        self.assertFalse(self.runner.binary.is_symlink())

    def test_backend_snapshot_is_not_a_hard_link_and_survives_source_removal(self):
        expected = self.runner.binary.read_bytes()
        self.binary.write_bytes(smoke.ELF_MAGIC + b"in-place-builder-change")
        self.binary.unlink()
        self.assertEqual(self.runner.binary.read_bytes(), expected)
        self.assertEqual(self.runner.results["binary_sha256"], hashlib.sha256(expected).hexdigest())

    def test_kind_configuration_mounts_the_same_hashed_backend_snapshot(self):
        self.args.kind_image = "test-node:image"
        with patch.object(self.runner, "docker", return_value=""), patch.object(smoke, "command", side_effect=RuntimeError("stop after config creation")):
            with self.assertRaisesRegex(RuntimeError, "stop after config creation"):
                self.runner.suite_kubernetes()
        config = json.loads((self.runner.root / "kind.json").read_text())
        self.assertEqual(config["nodes"][0]["extraMounts"][0]["hostPath"], str(self.runner.binary))

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

    def test_cluster_cleanup_also_uses_only_private_kubeconfig(self):
        cluster = self.runner.prefix + "-kind"
        self.runner.clusters = [cluster]
        with patch.object(smoke, "command", return_value="") as command:
            self.assertEqual(self.runner.release_resources(), [])
        self.assertEqual(command.call_args.args, ("kind", "delete", "cluster", "--name", cluster,
            "--kubeconfig", str(self.runner.root / "kubeconfig")))
        self.assertEqual(self.runner.clusters, [])

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

    def test_session_checks_release_identity_without_exporting_runtime_environment(self):
        version = {"ServerVersion": "1.3.1", "DatabaseVersion": "2.45.0", "Build": {}, "Dependencies": {},
            "Runtime": {"Env": ["NEVER_EXPORT=test-value"]}}
        with patch.object(self.runner, "request", side_effect=[{"ready": True}, None, {"jwt": "ephemeral-token"}, version]):
            self.runner.initialize_session()
        self.assertNotIn("Runtime", self.runner.results["server_version"])
        self.assertNotIn("NEVER_EXPORT", json.dumps(self.runner.results))

    def test_session_rejects_wrong_datastore_or_release_artifact(self):
        version = {"ServerVersion": "2.45.0", "DatabaseVersion": "2.45.0"}
        with patch.object(self.runner, "request", side_effect=[{"ready": True}, None, {"jwt": "ephemeral-token"}, version]):
            with self.assertRaisesRegex(AssertionError, "Artifact identity mismatch"):
                self.runner.initialize_session()

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

    def test_failed_checks_never_export_response_secrets_or_query_values(self):
        self.runner.base = "http://127.0.0.1:12345"
        payload = {"ClientSecret": "NEVER_EXPORT_RESPONSE", "jwt": "NEVER_EXPORT_TOKEN"}
        cases = [
            ("/settings?opaque=NEVER_EXPORT_QUERY", 403, {"return_value": self.response(payload, 200)}),
            ("/auth?opaque=NEVER_EXPORT_QUERY", None, {"side_effect": urllib.error.HTTPError(
                "url", 400, "invalid", {}, io.BytesIO(json.dumps(payload).encode()))}),
        ]
        for path, expected, mock_options in cases:
            with self.subTest(path=path), patch.object(smoke.urllib.request, "urlopen", **mock_options):
                with self.assertRaises(RuntimeError) as error:
                    self.runner.request("GET", path, expected=expected)
                self.assertNotIn("NEVER_EXPORT", str(error.exception))
                self.assertIn("HTTP ", str(error.exception))

    def test_expected_http_errors_are_checked_not_swallowed(self):
        self.runner.base = "http://127.0.0.1:12345"
        error = urllib.error.HTTPError("url", 404, "missing", {}, io.BytesIO(b'{"message":"missing"}'))
        with patch.object(smoke.urllib.request, "urlopen", side_effect=error):
            self.assertEqual(self.runner.request("GET", "/missing", expected=404), {"message": "missing"})
        with patch.object(smoke.urllib.request, "urlopen", return_value=self.response({}, 200)):
            with self.assertRaisesRegex(RuntimeError, "HTTP 200"):
                self.runner.request("GET", "/missing", expected=404)

    def test_swarm_force_update_accepts_wire_warning_shapes_and_waits_for_new_task(self):
        for warnings in (None, [], ["test warning"]):
            with self.subTest(warnings=warnings):
                old_task = {"ID": "old-task", "ServiceID": "actual-service", "Status": {"State": "running"}, "Spec": {"ForceUpdate": 7}}
                new_task = {"ID": "replacement-task", "ServiceID": "actual-service", "Status": {"State": "running"}, "Spec": {"ForceUpdate": 8}}
                responses = [[{"ID": "actual-service", "Spec": {"TaskTemplate": {"ForceUpdate": 7}}}],
                    {"Spec": {"TaskTemplate": {"ForceUpdate": 7}}, "UpdateStatus": {"State": "completed"}}, [old_task], {"Warnings": warnings},
                    {"Spec": {"TaskTemplate": {"ForceUpdate": 8}}}, [old_task, new_task]]
                with patch.object(self.runner, "request", side_effect=responses) as request:
                    result = self.runner.force_update_service(9)
                self.assertEqual(result["force_update_before"], 7)
                self.assertEqual(result["force_update_after"], 8)
                self.assertTrue(result["replacement_task_running"])
                self.assertEqual(result["warnings_shape"], "null" if warnings is None else "string-array")
                self.assertEqual(request.call_args_list[3].args, ("PUT", "/endpoints/9/forceupdateservice", {"ServiceID": "actual-service", "PullImage": False}))

    def test_swarm_force_update_rejects_invalid_warning_shapes(self):
        for warnings in ("not-an-array", ["valid", 7]):
            with self.subTest(warnings=warnings):
                responses = [[{"ID": "service", "Spec": {"TaskTemplate": {}}}], {"Spec": {"TaskTemplate": {}}},
                    [{"ID": "old-task", "ServiceID": "service", "Status": {"State": "running"}}], {"Warnings": warnings}]
                with patch.object(self.runner, "request", side_effect=responses):
                    with self.assertRaisesRegex(AssertionError, "Invalid force-update Warnings shape"):
                        self.runner.force_update_service(9)

    def test_edge_http_url_uses_only_the_owned_nested_engine_bridge(self):
        self.args.agent_image = "test-agent:image"
        engine = self.runner.prefix + "-dind"
        with patch.object(self.runner, "engine", return_value=engine), patch.object(self.runner, "start_vessel", return_value="owned-vessel"), patch.object(self.runner, "docker", return_value="172.17.0.1") as docker, patch.object(self.runner, "endpoint", return_value=7) as endpoint, patch.object(self.runner, "request", return_value={"EdgeID": "fixture-id", "EdgeKey": "fixture-key"}), patch.object(self.runner, "container_crud", return_value={}), patch.object(self.runner, "remove"), patch.object(smoke, "wait_for", side_effect=[True, {"ServerVersion": "29.8.2"}]):
            self.runner.suite_edge()
        self.assertEqual(docker.call_args_list[0].args[:6], ("exec", engine, "docker", "network", "inspect", "bridge"))
        endpoint.assert_called_once_with("edge", "http://172.17.0.1:9000", creation_type=4)
        nested_run = docker.call_args_list[-1].args
        self.assertEqual(nested_run[:4], ("exec", engine, "docker", "run"))
        self.assertNotIn("--network=host", nested_run)
        self.assertNotIn("-p", nested_run)

    def test_missing_azure_access_is_an_explicit_gate_not_a_mock_pass(self):
        with patch.object(smoke.shutil, "which", return_value=None), patch.dict(smoke.os.environ, {}, clear=True), patch.object(smoke, "command") as command:
            with self.assertRaises(smoke.ExternalGate):
                self.runner.suite_aci()
        command.assert_not_called()
        self.assertEqual(self.runner.results["aci_gate"], {"azure_cli_installed": False, "azure_environment_names_present": []})

    def frontend_fixture(self, label="source"):
        source = Path(self.tmp.name) / label / "web-src" / ".next" / "standalone"
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
        return source

    def test_frontend_artifact_is_copied_and_only_disposable_metadata_is_rewritten(self):
        source = self.frontend_fixture()
        server = source / "web-src" / "server.js"
        with patch.object(smoke.subprocess, "Popen") as popen, patch.object(smoke, "wait_for"):
            self.assertEqual(self.runner.start_frontend(14568), "http://127.0.0.1:14568")
        self.assertIn("http://localhost:9000", server.read_text())
        copy = self.runner.root / "frontend" / "web-src"
        self.assertIn(self.runner.base, (copy / "server.js").read_text())
        self.assertIn(self.runner.base, (copy / ".next" / "routes-manifest.json").read_text())
        self.assertEqual(popen.call_args.kwargs["env"]["PORTAINER_API_ORIGIN"], self.runner.base)
        self.assertEqual(popen.call_args.kwargs["env"]["HOSTNAME"], "127.0.0.1")
        self.assertEqual(self.runner.results["frontend"]["build_id"], "test-build-id")

    def test_unguarded_copytree_symlinks_can_rewrite_a_harmless_source_target(self):
        # Reproduction of the original flaw, entirely in this test's temp tree.
        source = Path(self.tmp.name) / "unguarded"
        source.mkdir()
        target = source / "original-server.js"
        target.write_text("harmless original")
        (source / "server.js").symlink_to(target)
        copied = Path(self.tmp.name) / "unguarded-copy"
        shutil.copytree(source, copied, symlinks=True)
        (copied / "server.js").write_text("harmless rewrite")
        self.assertEqual(target.read_text(), "harmless rewrite")

    def test_frontend_rejects_all_escaping_rewrite_file_links_before_any_write(self):
        files = ("web-src/server.js", "web-src/.next/routes-manifest.json", "web-src/.next/required-server-files.json")
        for index, relative in enumerate(files):
            for link_kind in ("absolute", "relative"):
                with self.subTest(file=relative, kind=link_kind):
                    source = self.frontend_fixture(f"escape-{index}-{link_kind}")
                    original = source / relative
                    expected = original.read_bytes()
                    target = source.parent / f"external-target-{index}"
                    original.rename(target)
                    original.symlink_to(target if link_kind == "absolute" else os.path.relpath(target, original.parent))
                    untouched = {path: (source / path).read_bytes() for path in files}
                    runner = smoke.Smoke(self.args)
                    runner.base = "http://127.0.0.1:14567"
                    try:
                        with patch.object(smoke.subprocess, "Popen") as popen:
                            with self.assertRaisesRegex(RuntimeError, "escaping or cyclic symlink"):
                                runner.start_frontend(14568)
                        popen.assert_not_called()
                        self.assertEqual(target.read_bytes(), expected)
                        for path, contents in untouched.items():
                            self.assertEqual((source / path).read_bytes(), contents)
                    finally:
                        runner.tmp.cleanup()

    def test_frontend_rejects_escaping_directory_links_without_modifying_target(self):
        source = self.frontend_fixture()
        directory = source / "web-src" / ".next"
        external = source.parent / "external-next"
        directory.rename(external)
        directory.symlink_to(external, target_is_directory=True)
        target = external / "routes-manifest.json"
        expected = target.read_bytes()
        with patch.object(smoke.subprocess, "Popen") as popen:
            with self.assertRaisesRegex(RuntimeError, "escaping or cyclic symlink"):
                self.runner.start_frontend(14568)
        popen.assert_not_called()
        self.assertEqual(target.read_bytes(), expected)

    def test_frontend_rejects_escaping_preexisting_asset_destination(self):
        source = self.frontend_fixture()
        static = source.parent / "static"
        target = static / "sentinel.css"
        target.write_text("harmless stylesheet")
        (source / "web-src" / ".next" / "static").symlink_to(static, target_is_directory=True)
        with patch.object(smoke.subprocess, "Popen") as popen:
            with self.assertRaisesRegex(RuntimeError, "escaping or cyclic symlink"):
                self.runner.start_frontend(14568)
        popen.assert_not_called()
        self.assertEqual(target.read_text(), "harmless stylesheet")

    def test_frontend_preserves_internal_relative_links_without_source_writes(self):
        source = self.frontend_fixture()
        server = source / "web-src" / "server.js"
        target = server.parent / ".next" / "real-server.js"
        server.rename(target)
        server.symlink_to(".next/real-server.js")
        expected = target.read_bytes()
        with patch.object(smoke.subprocess, "Popen"), patch.object(smoke, "wait_for"):
            self.runner.start_frontend(14568)
        self.assertEqual(target.read_bytes(), expected)
        private_server = self.runner.root / "frontend" / "web-src" / "server.js"
        self.assertTrue(private_server.is_symlink())
        self.assertIn(self.runner.base, private_server.read_text())
        self.assertNotIn(self.runner.base, target.read_text())

    def test_symlink_guard_rejects_cycles_and_dangling_escapes(self):
        root = Path(self.tmp.name) / "links"
        root.mkdir()
        link = root / "link"
        for target in ("link", "../absent-outside-target"):
            with self.subTest(target=target):
                link.symlink_to(target)
                try:
                    with self.assertRaisesRegex(RuntimeError, "escaping or cyclic symlink"):
                        smoke.reject_symlink_escapes(root)
                finally:
                    link.unlink()

    def test_symlink_guard_preserves_internal_dangling_package_links(self):
        root = Path(self.tmp.name) / "standalone"
        bins = root / "node_modules" / ".bin"
        bins.mkdir(parents=True)
        (bins / "optional-tool").symlink_to("../optional-package/bin/tool")
        smoke.reject_symlink_escapes(root)

    def execute_without_resources(self):
        self.args.suites = "aci"
        with patch.object(self.runner, "suite_aci", side_effect=smoke.ExternalGate("account unavailable")), patch.object(self.runner, "release_resources", return_value=[]), contextlib.redirect_stdout(io.StringIO()):
            return self.runner.execute()

    def test_default_reports_are_unique_private_and_retained_after_cleanup(self):
        paths = []
        # Force defaults into this test's temp tree, never a shared /tmp target.
        with patch.object(smoke.tempfile, "tempdir", self.tmp.name):
            for _ in range(2):
                self.args.output = None
                self.assertEqual(self.execute_without_resources(), 2)
                path = Path(self.args.output)
                paths.append(path)
                self.assertEqual(path.parent, Path(self.tmp.name))
                self.assertEqual(path.stat().st_mode & 0o777, 0o600)
                self.assertEqual(json.loads(path.read_text())["cleanup_failures"], [])
                self.assertFalse(self.runner.root.exists())
        self.assertNotEqual(paths[0], paths[1])
        self.assertTrue(all(path.is_file() for path in paths))

    def test_explicit_reports_refuse_symlinks_hardlinks_and_existing_files_without_clobber(self):
        target = Path(self.tmp.name) / "untouched.json"
        target.write_bytes(b"harmless original")
        link = Path(self.tmp.name) / "report-link.json"
        link.symlink_to(target)
        hardlink = Path(self.tmp.name) / "report-hardlink.json"
        os.link(target, hardlink)
        dangling = Path(self.tmp.name) / "dangling-report.json"
        absent = Path(self.tmp.name) / "must-not-create.json"
        dangling.symlink_to(absent)
        for path in (link, hardlink, target, dangling):
            with self.subTest(path=path):
                self.args.output = str(path)
                with self.assertRaises(FileExistsError):
                    self.execute_without_resources()
                self.assertEqual(target.read_bytes(), b"harmless original")
                self.assertFalse(self.runner.root.exists())
        self.assertTrue(link.is_symlink())
        self.assertFalse(absent.exists())

    def test_explicit_report_is_private_even_with_permissive_umask(self):
        self.args.output = str(Path(self.tmp.name) / "new-report.json")
        original = os.umask(0)
        try:
            self.assertEqual(self.execute_without_resources(), 2)
        finally:
            os.umask(original)
        self.assertEqual(Path(self.args.output).stat().st_mode & 0o777, 0o600)

    def oauth_companion(self, user, settings_denied=True, screenshot=None, capture_labels=("",)):
        self.args.playwright_module = "/trusted/test-playwright"
        self.args.frontend_standalone = None
        self.args.chrome = None
        self.args.htpasswd = "test-htpasswd"
        self.args.dex_image = "test-dex:image"
        self.args.oauth_screenshot = str(screenshot) if screenshot else None
        self.runner.base = "http://127.0.0.1:14567"
        self.runner.token = "original-admin-token"
        observed = {}

        def request(method, path, *args, **kwargs):
            if path == "/auth/oauth/validate":
                return {"jwt": "test-user-token"}
            if path == "/users/me":
                self.assertEqual(self.runner.token, "test-user-token")
                return user
            if method == "GET" and path == "/settings" and not settings_denied:
                raise RuntimeError("HTTP 200 (response body omitted)")
            return None

        def command(*args, **kwargs):
            if args[0] == "test-htpasswd":
                return "smoke:test-hash"
            config = json.loads(kwargs["input"])
            observed["browser_screenshot"] = config["screenshot"]
            state = smoke.urllib.parse.parse_qs(smoke.urllib.parse.urlsplit(config["authorizeURL"]).query)["state"][0]
            url = config["callback"] + "?" + smoke.urllib.parse.urlencode({"state": state, "code": "never-export-test-code"})
            try:
                with smoke.urllib.request.urlopen(url, timeout=5) as response:
                    observed["status"] = response.status
                    observed["body"] = response.read().decode()
            except smoke.urllib.error.HTTPError as error:
                with error:
                    observed["status"] = error.code
                    observed["body"] = error.read().decode()
            if config["screenshot"]:
                path = Path(config["screenshot"])
                for label in capture_labels:
                    path.with_name(path.stem + label + path.suffix).write_bytes(b"harmless screenshot")
            if observed["status"] != 200:
                # The real browser rejects the failed callback heading/status.
                raise RuntimeError("Browser rejected failed OAuth callback")
            return ""

        with patch.object(self.runner, "new_network", return_value="owned-network"), patch.object(self.runner, "run", return_value="owned-container"), patch.object(self.runner, "docker", return_value="127.0.0.1:14568"), patch.object(self.runner, "start_vessel", return_value="owned-vessel"), patch.object(self.runner, "remove"), patch.object(self.runner, "request", side_effect=request), patch.object(smoke, "command", side_effect=command), patch.object(smoke, "wait_for"):
            try:
                self.runner.suite_oauth()
            except (RuntimeError, AssertionError, OSError) as error:
                observed["error"] = str(error)
        self.assertEqual(self.runner.token, "original-admin-token")
        return observed

    def test_oauth_companion_rejects_wrong_identity_role_or_acl_and_restores_token(self):
        cases = [({"Username": "other@example.invalid", "Role": 2}, True),
                 ({"Username": "smoke@example.invalid", "Role": 1}, True),
                 ({"Username": "smoke@example.invalid", "Role": 2}, False)]
        for user, denied in cases:
            with self.subTest(user=user, denied=denied):
                result = self.oauth_companion(user, settings_denied=denied)
                self.assertEqual(result["status"], 500)
                self.assertIn("OAuth verification failed", result["body"])
                self.assertNotIn("never-export", result["body"] + result["error"])
                self.assertNotIn("test-user-token", result["body"] + result["error"])
                self.assertNotIn("correctly denied", result["body"])

    def test_oauth_companion_accepts_actual_identity_and_acl(self):
        result = self.oauth_companion({"Username": "smoke@example.invalid", "Role": 2})
        self.assertEqual(result["status"], 200)
        self.assertNotIn("error", result)

    def test_screenshot_is_staged_privately_and_retained_without_following_output_links(self):
        target = Path(self.tmp.name) / "original.png"
        target.write_bytes(b"harmless original")
        output = Path(self.tmp.name) / "screenshot.png"
        output.symlink_to(target)
        result = self.oauth_companion({"Username": "smoke@example.invalid", "Role": 2}, screenshot=output)
        self.assertEqual(target.read_bytes(), b"harmless original")
        self.assertNotEqual(result["browser_screenshot"], str(output))
        self.assertIn("error", result)
        output.unlink()
        result = self.oauth_companion({"Username": "smoke@example.invalid", "Role": 2}, screenshot=output)
        self.assertNotIn("error", result)
        self.assertEqual(output.read_bytes(), b"harmless screenshot")
        self.assertEqual(output.stat().st_mode & 0o777, 0o600)

    def test_derived_screenshots_also_refuse_output_symlinks(self):
        target = Path(self.tmp.name) / "original.png"
        target.write_bytes(b"harmless original")
        output = Path(self.tmp.name) / "screenshot.png"
        derived = output.with_name("screenshot-mobile.png")
        derived.symlink_to(target)
        result = self.oauth_companion({"Username": "smoke@example.invalid", "Role": 2}, screenshot=output, capture_labels=("", "-mobile", "-login"))
        self.assertEqual(target.read_bytes(), b"harmless original")
        self.assertTrue(derived.is_symlink())
        self.assertIn("error", result)

    def test_companion_identity_and_acl_checks_survive_optimized_python(self):
        result = subprocess.run([sys.executable, "-O", "-m", "unittest",
            "test_platform_smoke.PlatformSmokeTests.test_oauth_companion_rejects_wrong_identity_role_or_acl_and_restores_token"],
            cwd=Path(smoke.__file__).parent, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_optimized_python_is_refused_before_any_verification(self):
        result = subprocess.run([sys.executable, "-O", str(Path(smoke.__file__))], capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 2)
        self.assertIn("requires assertions enabled", result.stderr)

    def test_interruption_still_cleans_resources_and_writes_an_interrupted_result(self):
        self.args.suites = "docker"
        self.args.output = str(Path(self.tmp.name) / "result.json")
        with patch.object(self.runner, "suite_engine", side_effect=KeyboardInterrupt), patch.object(self.runner, "release_resources", return_value=[]) as release, contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(KeyboardInterrupt):
                self.runner.execute()
        release.assert_called_once()
        result = json.loads(Path(self.args.output).read_text())
        self.assertEqual(result["suites"]["docker"]["status"], "interrupted")
        self.assertEqual(result["cleanup_failures"], [])

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
