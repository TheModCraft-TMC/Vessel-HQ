#!/usr/bin/env python3
"""Real isolated platform smoke tests; never touches the host engine's Swarm or kubeconfig.

All created Docker resources have a unique vessel-rest-platform-* name. Engines
listen on their own network namespace's loopback, shared only with the test Vessel
container. The host receives only random 127.0.0.1 Vessel/provider ports.
"""
import argparse
import hashlib
import http.server
import json
import os
from pathlib import Path
import secrets
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
import urllib.parse
import uuid

PREFIX = "vessel-rest-platform-"
SUITES = ("docker", "swarm", "podman", "kubernetes", "edge", "oauth", "aci")


class ExternalGate(RuntimeError):
    """A required externally authorized capability is unavailable; not a pass."""


def command(*args, check=True, timeout=240, input=None):
    result = subprocess.run(args, input=input, text=True, capture_output=True, timeout=timeout)
    if check and result.returncode:
        # Commands may contain credentials; never include argv in errors.
        raise RuntimeError(f"{Path(args[0]).name} failed ({result.returncode}): {result.stderr[-2500:]}")
    return result.stdout.strip()


def wait_for(fn, timeout=120):
    end = time.monotonic() + timeout
    last = None
    while time.monotonic() < end:
        try:
            value = fn()
            if value:
                return value
        except (RuntimeError, urllib.error.URLError, ConnectionError, TimeoutError, ValueError, KeyError) as error:
            last = error
        time.sleep(2)
    raise RuntimeError(f"Timed out waiting for readiness: {last}")


def reject_symlink_escapes(root):
    """Allow relative artifact links only when their resolved target stays inside root.

    This is used on the private standalone copy before any write through its
    paths, and on asset inputs before dereferencing them. The private directory
    is not shared with the artifact's builder or a running frontend process.
    """
    root = Path(root).resolve()
    for directory, directories, files in os.walk(root, followlinks=False):
        for name in directories + files:
            path = Path(directory) / name
            if not path.is_symlink():
                continue
            try:
                target = path.resolve()
                target.relative_to(root)
            except (OSError, RuntimeError, ValueError) as error:
                raise RuntimeError("Frontend artifact contains an escaping or cyclic symlink: " + str(path.relative_to(root))) from error


class Smoke:
    def __init__(self, args):
        self.args = args
        self.prefix = PREFIX + uuid.uuid4().hex[:10]
        self.containers = []
        self.networks = []
        self.volumes = []
        self.clusters = []
        self.processes = []
        self.tmp = tempfile.TemporaryDirectory(prefix=self.prefix + "-")
        self.root = Path(self.tmp.name)
        # Open the supplied executable once: a builder can atomically replace its
        # source path later without changing the bytes hashed or mounted here.
        # Do not use hard links or preserve a source executable symlink.
        self.binary = self.root / "portainer"
        try:
            with Path(args.binary).open("rb") as source, self.binary.open("xb") as destination:
                shutil.copyfileobj(source, destination)
            self.binary.chmod(0o555)
        except BaseException:
            self.tmp.cleanup()
            raise
        self.token = None
        self.base = None
        self.results = {"resource_prefix": self.prefix, "binary_sha256": hashlib.sha256(self.binary.read_bytes()).hexdigest(),
                        "runtime_image": args.runtime_image, "images": {}, "suites": {}}

    def docker(self, *args, **kwargs):
        return command("docker", *args, **kwargs)

    def new_network(self, suffix):
        name = self.prefix + "-" + suffix + "-" + uuid.uuid4().hex[:4]
        self.docker("network", "create", "--label", "vessel.platform-smoke=" + self.prefix, name)
        self.networks.append(name)
        return name

    def new_volume(self, suffix):
        name = self.prefix + "-" + suffix + "-" + uuid.uuid4().hex[:4]
        self.docker("volume", "create", "--label", "vessel.platform-smoke=" + self.prefix, name)
        self.volumes.append(name)
        return name

    def run(self, suffix, image, arguments=(), options=()):
        name = self.prefix + "-" + suffix
        try:
            self.docker("run", "-d", "--name", name, "--label", "vessel.platform-smoke=" + self.prefix,
                        "--memory", "768m", "--cpus", "2", *options, image, *arguments)
        except Exception:
            self.docker("rm", "-fv", name, check=False)
            raise
        self.containers.append(name)
        self.results["images"][image] = json.loads(self.docker("image", "inspect", image, "--format", '{{json .RepoDigests}}')) or [
            self.docker("image", "inspect", image, "--format", "{{.Id}}")]

        return name

    def remove(self, name):
        self.docker("rm", "-fv", name)
        self.containers.remove(name)

    def request(self, method, path, data=None, fields=None, auth=True, expected=None):
        headers = {}
        if auth and self.token:
            headers["Authorization"] = "Bearer " + self.token
        if fields is not None:
            boundary = uuid.uuid4().hex
            headers["Content-Type"] = "multipart/form-data; boundary=" + boundary
            body = "".join(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n' for key, value in fields.items()) + f"--{boundary}--\r\n"
            body = body.encode()
        elif data is not None:
            headers["Content-Type"] = "application/json"
            body = json.dumps(data).encode()
        else:
            body = None
        request = urllib.request.Request(self.base + "/api" + path, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                status, raw = response.status, response.read()
        except urllib.error.HTTPError as error:
            status, raw = error.code, error.read()
        if (expected is not None and status != expected) or (expected is None and status >= 400):
            # Error responses may contain provider details, but never dump successful auth responses.
            raise RuntimeError(f"{method} {path}: HTTP {status}: {raw.decode(errors='replace')[:1500]}")
        if not raw:
            return None
        try:
            return json.loads(raw)
        except ValueError:
            return raw.decode()

    def start_vessel(self, namespace=None, network=None, extra=(), flags=()):
        data = self.root / ("data-" + uuid.uuid4().hex[:6])
        data.mkdir()
        opts = ["--mount", f"type=bind,source={self.binary},target=/vessel/portainer,readonly",
                "--mount", f"type=bind,source={data},target=/data", "--entrypoint", "/vessel/portainer"]
        if namespace:
            opts += ["--network", "container:" + namespace]
            port_container = namespace
        else:
            opts += ["-p", "127.0.0.1::9000"]
            if network:
                opts += ["--network", network]
        opts += list(extra)
        name = self.run("vessel-" + uuid.uuid4().hex[:4], self.args.runtime_image,
                        ["--data", "/data", "--assets", "/vessel", "--http-enabled", "--bind", ":9000", "--no-setup-token", *flags], opts)
        port_container = namespace or name
        port = self.docker("port", port_container, "9000/tcp").rsplit(":", 1)[1]
        self.base = "http://127.0.0.1:" + port
        self.initialize_session()
        return name

    def initialize_session(self):
        self.token = None
        wait_for(lambda: self.request("GET", "/status", auth=False))
        password = secrets.token_urlsafe(24)
        self.request("POST", "/users/admin/init", {"Username": "admin", "Password": password}, auth=False)
        self.token = self.request("POST", "/auth", {"Username": "admin", "Password": password}, auth=False)["jwt"]
        version = self.request("GET", "/system/version")
        if version.get("ServerVersion") != self.args.expected_release or version.get("DatabaseVersion") != self.args.expected_datastore:
            raise AssertionError("Artifact identity mismatch: expected Vessel " + self.args.expected_release + "/datastore " +
                self.args.expected_datastore + ", got " + str(version.get("ServerVersion")) + "/" + str(version.get("DatabaseVersion")))
        self.results["server_version"] = {key: version[key] for key in ("ServerVersion", "DatabaseVersion", "Build", "Dependencies")}

    def endpoint(self, suffix, url, creation_type=1, engine="docker"):
        endpoint = self.request("POST", "/endpoints", fields={"Name": self.prefix + "-" + suffix, "URL": url,
                "EndpointCreationType": str(creation_type), "ContainerEngine": engine, "TLS": "false"})
        return endpoint["Id"]

    def engine(self, podman=False):
        network = self.new_network("engine-net")
        if podman:
            root_volume = self.new_volume("podman-root")
            home_volume = self.new_volume("podman-home")
            name = self.run("podman", self.args.podman_image,
                ["podman", "--storage-driver=vfs", "--cgroup-manager=cgroupfs", "--events-backend=file", "system", "service", "--time=0", "tcp:127.0.0.1:2375"],
                ["--privileged", "--security-opt", "label=disable", "-e", "NETAVARK_FW=iptables", "-p", "127.0.0.1::9000", "--network", network,
                 "--mount", f"type=volume,source={root_volume},target=/var/lib/containers",
                 "--mount", f"type=volume,source={home_volume},target=/home/podman/.local/share/containers"])
            # The official minimal image ships nft but not iptables. Nested
            # custom bridges need the latter on this Docker Desktop kernel.
            # Install only inside this disposable fixture, using Fedora's signed
            # package repository; never change host/global Podman settings.
            self.docker("exec", name, "dnf", "install", "-y", "--setopt=gpgcheck=1", "iptables-nft", timeout=180)
            self.results["podman_fixture_firewall"] = self.docker("exec", name, "rpm", "-q", "iptables-nft")
            wait_for(lambda: self.docker("exec", name, "podman", "--storage-driver=vfs", "info", "--format", "json"))
        else:
            volume = self.new_volume("dind-data")
            name = self.run("dind", self.args.dind_image,
                ["dockerd", "--host=unix:///var/run/docker.sock", "--host=tcp://127.0.0.1:2375", "--tls=false"],
                ["--privileged", "-e", "DOCKER_TLS_CERTDIR=", "-p", "127.0.0.1::9000", "--network", network,
                 "--mount", f"type=volume,source={volume},target=/var/lib/docker"])
            wait_for(lambda: self.docker("exec", name, "docker", "info", "--format", "{{.ServerVersion}}"))
        return name

    def container_crud(self, endpoint):
        route = f"/endpoints/{endpoint}/docker"
        self.request("POST", route + "/images/create?fromImage=docker.io/library/alpine&tag=3.22")
        container = self.request("POST", route + "/containers/create?name=" + self.prefix + "-crud",
            {"Image": "docker.io/library/alpine:3.22", "Cmd": ["sh", "-c", "echo vessel-isolated-real-client; sleep 300"],
             "Labels": {"vessel.platform-smoke": self.prefix}})["Id"]
        self.request("POST", route + f"/containers/{container}/start")
        state = self.request("GET", route + f"/containers/{container}/json")
        assert state["State"]["Running"], "Container did not start"
        self.request("POST", route + f"/containers/{container}/rename?name=" + self.prefix + "-renamed")
        assert self.request("GET", route + f"/containers/{container}/json")["Name"].lstrip("/") == self.prefix + "-renamed"
        logs = self.request("GET", route + f"/containers/{container}/logs?stdout=1&stderr=1")
        assert "vessel-isolated-real-client" in logs
        self.request("POST", route + f"/containers/{container}/stop?t=2")
        self.request("DELETE", route + f"/containers/{container}")
        self.request("GET", route + f"/containers/{container}/json", expected=404)
        return {"container_crud": "passed", "logs": "passed"}

    def stack_crud(self, endpoint, swarm_id=None):
        content = 'services:\n  smoke:\n    image: docker.io/library/alpine:3.22\n    command: ["sh", "-c", "sleep 300"]\n'
        payload = {"Name": self.prefix + "-stack", "StackFileContent": content, "Env": []}
        if swarm_id:
            payload["SwarmID"] = swarm_id
        kind = "swarm" if swarm_id else "standalone"
        stack = self.request("POST", f"/stacks/create/{kind}/string?endpointId={endpoint}", payload)
        sid = stack["Id"]
        route = f"/endpoints/{endpoint}/docker"
        def ready():
            state = self.request("GET", f"/stacks/{sid}")
            if state.get("Status") == 4:
                raise AssertionError("Stack deployment failed: " + str(state.get("DeploymentStatus")))
            if swarm_id:
                return any(task["Status"]["State"] == "running" for task in self.request("GET", route + "/tasks"))
            return self.request("GET", route + "/containers/json")
        wait_for(ready)
        self.request("PUT", f"/stacks/{sid}?endpointId={endpoint}", {"StackFileContent": content.replace("sleep 300", "sleep 301"), "Env": [], "Prune": True})
        wait_for(lambda: self.request("GET", f"/stacks/{sid}")["Status"] == 1)
        workload_route = route + ("/services" if swarm_id else "/containers/json")
        wait_for(lambda: "sleep 301" in json.dumps(self.request("GET", workload_route)))
        if swarm_id:
            wait_for(lambda: any(task["Status"]["State"] == "running" and "sleep 301" in json.dumps(task["Spec"])
                for task in self.request("GET", route + "/tasks")))
        self.request("DELETE", f"/stacks/{sid}?endpointId={endpoint}")
        self.request("GET", f"/stacks/{sid}", expected=404)
        wait_for(lambda: not self.request("GET", route + ("/services" if swarm_id else "/containers/json")))
        return "passed"

    def suite_engine(self, name):
        podman = name == "podman"
        engine = self.engine(podman)
        vessel = self.start_vessel(namespace=engine)
        endpoint = self.endpoint(name, "tcp://127.0.0.1:2375", engine="podman" if podman else "docker")
        info = self.request("GET", f"/endpoints/{endpoint}/docker/info")
        if podman:
            assert info.get("ServerVersion", "").startswith("5."), "Not an actual Podman server"
        result = {"engine_version": info.get("ServerVersion"), **self.container_crud(endpoint)}
        if name == "swarm":
            # This is exclusively the nested disposable daemon, never the host.
            self.docker("exec", engine, "docker", "swarm", "init")
            swarm = self.request("GET", f"/endpoints/{endpoint}/docker/swarm")
            result["swarm_stack_crud"] = self.stack_crud(endpoint, swarm["ID"])
        elif name in ("docker", "podman"):
            result["compose_stack_crud"] = self.stack_crud(endpoint)
        self.request("PUT", f"/endpoints/{endpoint}", {"Name": self.prefix + "-updated"})
        assert self.request("GET", f"/endpoints/{endpoint}")["Name"] == self.prefix + "-updated"
        self.request("DELETE", f"/endpoints/{endpoint}")
        self.request("GET", f"/endpoints/{endpoint}", expected=404)
        result["environment_crud"] = "passed"
        self.remove(vessel)
        self.remove(engine)
        return result

    def start_frontend(self, port):
        source = Path(self.args.frontend_standalone).resolve()
        destination = self.root / "frontend"
        # Preserve internal package links, but reject escapes before any writes
        # through copied paths (including directory symlinks and asset targets).
        shutil.copytree(source, destination, symlinks=True)
        reject_symlink_escapes(destination)
        static = source.parent / "static"
        public = source.parent.parent / "public"
        reject_symlink_escapes(static)
        reject_symlink_escapes(public)
        shutil.copytree(static, destination / "web-src" / ".next" / "static", dirs_exist_ok=True)
        shutil.copytree(public, destination / "web-src" / "public", dirs_exist_ok=True)
        reject_symlink_escapes(destination)
        server = destination / "web-src" / "server.js"
        original = server.read_text()
        if "http://localhost:9000" not in original:
            raise RuntimeError("Standalone build has an unexpected API rewrite; provide a build targeting http://localhost:9000")
        server.write_text(original.replace("http://localhost:9000", self.base))
        for name in ("routes-manifest.json", "required-server-files.json"):
            manifest = destination / "web-src" / ".next" / name
            manifest.write_text(manifest.read_text().replace("http://localhost:9000", self.base))
        env = {**os.environ, "PORT": str(port), "HOSTNAME": "127.0.0.1", "NODE_ENV": "production", "PORTAINER_API_ORIGIN": self.base}
        with (self.root / "frontend.log").open("w") as log:
            process = subprocess.Popen(["node", str(server)], env=env, stdout=log, stderr=log)
        self.processes.append(process)
        frontend = "http://127.0.0.1:" + str(port)
        wait_for(lambda: urllib.request.urlopen(frontend + "/login", timeout=5).status == 200)
        self.results["frontend"] = {"standalone_server_sha256": hashlib.sha256(original.encode()).hexdigest(),
            "build_id": (destination / "web-src" / ".next" / "BUILD_ID").read_text().strip(),
            "topology": "disposable standalone copy with rewrite to isolated Vessel API"}
        return frontend

    def suite_aci(self):
        cli = shutil.which("az")
        names = sorted(key for key in os.environ if key.upper().startswith(("AZURE_", "ARM_")))
        metadata = {"azure_cli_installed": bool(cli), "azure_environment_names_present": names}
        if cli:
            # Normal existing-account metadata only: never login, enumerate secret
            # stores, or provision paid resources without an authorized account.
            account = command(cli, "account", "show", "--query", "{state:state}", "-o", "json", check=False)
            metadata["existing_account_available"] = bool(account)
        self.results["aci_gate"] = metadata
        raise ExternalGate("Live ACI requires an authorized nonproduction Azure subscription and service principal with Container Instances permissions. "
            "No cloud login or resource creation was attempted; existing CLI/account metadata only: " + json.dumps(metadata))

    def suite_oauth(self):
        if not self.args.playwright_module:
            raise RuntimeError("OAuth needs --playwright-module (installed Playwright package path); see platform verification guide")
        network = self.new_network("oauth-net")
        namespace = self.run("oauth-netns", "alpine:3.22", ["sleep", "600"], ["--network", network, "-p", "127.0.0.1::9000", "-p", "127.0.0.1::5556"])
        provider_port = self.docker("port", namespace, "5556/tcp").rsplit(":", 1)[1]
        issuer = "http://127.0.0.1:" + provider_port + "/dex"
        frontend = None
        if self.args.frontend_standalone:
            with socket.socket() as sock:
                sock.bind(("127.0.0.1", 0))
                port = sock.getsockname()[1]
            frontend = "http://127.0.0.1:" + str(port)
            vessel = self.start_vessel(namespace=namespace, flags=["--trusted-origins=" + frontend])
            self.start_frontend(port)
        else:
            vessel = self.start_vessel(namespace=namespace)
        state = secrets.token_urlsafe(24)
        email = "smoke@example.invalid"
        password = secrets.token_urlsafe(24)
        client_secret = secrets.token_urlsafe(32)
        hashed = command(self.args.htpasswd, "-niBC", "10", "smoke", input=password + "\n").split(":", 1)[1]
        owner = self
        completed = {}

        class Callback(http.server.BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass  # A callback URL contains a one-time authorization code.

            def do_GET(self):
                query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
                if not secrets.compare_digest(query.get("state", [""])[0], state) or not query.get("code"):
                    self.send_response(400)
                    self.end_headers()
                    return
                try:
                    auth = owner.request("POST", "/auth/oauth/validate", {"Code": query["code"][0]}, auth=False)
                    original = owner.token
                    try:
                        owner.token = auth["jwt"]
                        user = owner.request("GET", "/users/me")
                        assert user["Username"] == email and user["Role"] == 2
                        owner.request("GET", "/settings", expected=403)
                        completed["identity"] = "provisioned-standard-user"
                    finally:
                        owner.token = original
                    title = "Real OAuth provider login passed"
                    self.send_response(200)
                except Exception:
                    completed["error"] = "Vessel OAuth code exchange or identity/ACL check failed"
                    title = "OAuth verification failed"
                    self.send_response(500)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(("<!doctype html><title>Vessel isolated OAuth verification</title><h1>" + title +
                    "</h1><p>Real Dex provider, browser authorization code callback, Vessel API code exchange and user provisioning.</p>"
                    "<p>Standard-user administration access correctly denied. All accounts and resources are disposable.</p>").encode())

        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Callback)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        callback = frontend + "/login" if frontend else f"http://127.0.0.1:{server.server_port}/callback"
        try:
            config = {"issuer": issuer, "storage": {"type": "memory"}, "web": {"http": "0.0.0.0:5556"},
                "oauth2": {"skipApprovalScreen": True}, "enablePasswordDB": True,
                "staticClients": [{"id": "vessel-smoke", "secret": client_secret, "name": "Vessel isolated smoke", "redirectURIs": [callback]}],
                "staticPasswords": [{"email": email, "hash": hashed, "username": "smoke", "userID": str(uuid.uuid4())}]}
            config_path = self.root / "dex.json"
            config_path.write_text(json.dumps(config))
            config_path.chmod(0o600)
            dex = self.run("dex", self.args.dex_image, ["dex", "serve", "/etc/dex/smoke.json"],
                ["--network", "container:" + namespace, "--user", "0:0", "--mount", f"type=bind,source={config_path},target=/etc/dex/smoke.json,readonly"])
            wait_for(lambda: urllib.request.urlopen(issuer + "/.well-known/openid-configuration", timeout=5).status == 200)
            self.request("PUT", "/settings", {"AuthenticationMethod": 3, "OAuthSettings": {
                "ClientID": "vessel-smoke", "ClientSecret": client_secret, "AccessTokenURI": "http://127.0.0.1:5556/dex/token",
                "AuthorizationURI": issuer + "/auth", "ResourceURI": "http://127.0.0.1:5556/dex/userinfo", "RedirectURI": callback,
                "UserIdentifier": "email", "Scopes": "openid email profile", "OAuthAutoCreateUsers": True, "AuthStyle": 2}})
            authorize = issuer + "/auth?" + urllib.parse.urlencode({"client_id": "vessel-smoke", "redirect_uri": callback,
                "response_type": "code", "scope": "openid email profile", "state": state})
            browser_config = {"playwrightModule": str(Path(self.args.playwright_module).resolve()), "chrome": self.args.chrome,
                "authorizeURL": authorize, "callback": callback, "email": email, "password": password,
                "screenshot": self.args.oauth_screenshot, "frontend": frontend}
            command("node", str(Path(__file__).with_name("oauth_browser.cjs")), input=json.dumps(browser_config), timeout=120)
            if frontend:
                user = next(user for user in self.request("GET", "/users") if user["Username"] == email)
                assert user["Role"] == 2
            else:
                assert completed.get("identity") == "provisioned-standard-user", completed.get("error", "Missing browser callback")
            self.request("PUT", "/settings", {"AuthenticationMethod": 1})
            self.remove(dex)
            self.remove(vessel)
            self.remove(namespace)
            return {"provider": self.args.dex_image, "browser_authorization_code_callback": "passed", "vessel_token_exchange_and_userinfo": "passed",
                "user_provisioning": "passed", "standard_user_admin_denial": "passed", "frontend_callback_component": "passed (production standalone)" if frontend else "not exercised (companion callback page)",
                "frontend_state_mismatch_rejected": "passed" if frontend else "not exercised",
                "frontend_cookie_session_reload": "passed" if frontend else "not exercised",
                "frontend_desktop_mobile_layout": "passed (1100px/390px)" if frontend else "not exercised"}
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=10)

    def suite_edge(self):
        engine = self.engine()
        vessel = self.start_vessel(namespace=engine)
        # The agent lives inside the nested engine, never on the shared host.
        gateway = self.docker("exec", engine, "docker", "network", "inspect", "bridge", "--format", "{{(index .IPAM.Config 0).Gateway}}")
        endpoint = self.endpoint("edge", "http://" + gateway + ":9000", creation_type=4)
        state = self.request("GET", f"/endpoints/{endpoint}")
        envfile = self.root / "edge.env"
        envfile.write_text("EDGE=1\nEDGE_ID=" + (state.get("EdgeID") or str(uuid.uuid4())) + "\nEDGE_KEY=" + state["EdgeKey"] + "\nEDGE_INSECURE_POLL=1\n")
        envfile.chmod(0o600)
        self.docker("cp", str(envfile), engine + ":/edge.env")
        self.docker("exec", engine, "docker", "run", "-d", "--name", self.prefix + "-agent", "--memory", "256m", "--cpus", "1", "--env-file", "/edge.env",
            "-v", "/var/run/docker.sock:/var/run/docker.sock", "-v", "/var/lib/docker/volumes:/var/lib/docker/volumes", self.args.agent_image)
        wait_for(lambda: self.request("GET", f"/endpoints/{endpoint}").get("EdgeID"), timeout=120)
        info = wait_for(lambda: self.request("GET", f"/endpoints/{endpoint}/docker/info"), timeout=120)
        result = {"agent_image": self.args.agent_image, "engine_version": info.get("ServerVersion"), "official_agent_poll_and_tunnel": "passed", **self.container_crud(endpoint)}
        self.request("DELETE", f"/endpoints/{endpoint}")
        self.remove(vessel)
        self.remove(engine)
        return result

    def suite_kubernetes(self):
        network = self.prefix + "-kind-net"
        self.docker("network", "create", network)
        self.networks.append(network)
        cluster = self.prefix + "-kind"
        kubeconfig = self.root / "kubeconfig"
        config = self.root / "kind.json"
        config.write_text(json.dumps({"kind": "Cluster", "apiVersion": "kind.x-k8s.io/v1alpha4",
            "networking": {"apiServerAddress": "127.0.0.1"}, "nodes": [{"role": "control-plane", "extraMounts": [
                {"hostPath": str(self.binary), "containerPath": "/vessel-smoke-binary", "readOnly": True}]}]}))
        self.clusters.append(cluster)  # Also remove partially created clusters on failure.
        command("env", "KIND_EXPERIMENTAL_DOCKER_NETWORK=" + network, "KUBECONFIG=" + str(kubeconfig),
            self.args.kind, "create", "cluster", "--name", cluster, "--image", self.args.kind_image,
            "--config", str(config), "--kubeconfig", str(kubeconfig), "--wait", "120s", timeout=360)
        self.docker("update", "--memory", "2g", "--memory-swap", "2g", "--cpus", "3", cluster + "-control-plane")
        self.results["images"][self.args.kind_image] = json.loads(self.docker("image", "inspect", self.args.kind_image, "--format", '{{json .RepoDigests}}'))
        # Exercise production in-cluster authentication, including the proxy's
        # service-account token loader, not only the development client shortcut.
        def kubectl(*args):
            return command("kubectl", "--kubeconfig", str(kubeconfig), *args)
        account = self.prefix + "-admin"
        kubectl("create", "serviceaccount", account)
        kubectl("create", "clusterrolebinding", account, "--clusterrole=cluster-admin", "--serviceaccount=default:" + account)
        command(self.args.kind, "load", "docker-image", self.args.runtime_image, "--name", cluster, timeout=240)
        pod_name = self.prefix + "-vessel"
        pod = {"apiVersion": "v1", "kind": "Pod", "metadata": {"name": pod_name}, "spec": {
            "serviceAccountName": account, "containers": [{"name": "vessel", "image": self.args.runtime_image, "imagePullPolicy": "Never",
                "command": ["/vessel/portainer", "--data", "/data", "--assets", "/vessel", "--http-enabled", "--bind", ":9000", "--no-setup-token"],
                "resources": {"requests": {"memory": "128Mi", "cpu": "100m"}, "limits": {"memory": "768Mi", "cpu": "2"}},
                "volumeMounts": [{"name": "binary", "mountPath": "/vessel/portainer", "readOnly": True}, {"name": "data", "mountPath": "/data"}]}],
            "volumes": [{"name": "binary", "hostPath": {"path": "/vessel-smoke-binary", "type": "File"}}, {"name": "data", "emptyDir": {}}]}}
        command("kubectl", "--kubeconfig", str(kubeconfig), "apply", "-f", "-", input=json.dumps(pod))
        kubectl("wait", "--for=condition=Ready", "pod/" + pod_name, "--timeout=90s")
        forward_log = self.root / "port-forward.log"
        with forward_log.open("w") as log:
            forward = subprocess.Popen(["kubectl", "--kubeconfig", str(kubeconfig), "port-forward", "--address=127.0.0.1", "pod/" + pod_name, ":9000"], stdout=log, stderr=log)
        self.processes.append(forward)
        def forwarded_port():
            import re
            match = re.search(r"127\.0\.0\.1:(\d+) -> 9000", forward_log.read_text())
            return match.group(1) if match else None
        self.base = "http://127.0.0.1:" + wait_for(forwarded_port)
        self.initialize_session()
        endpoint = self.endpoint("kubernetes", "https://kubernetes.default.svc", creation_type=5)
        native = f"/kubernetes/{endpoint}"
        proxy = f"/endpoints/{endpoint}/kubernetes"
        version = self.request("GET", native + "/version")
        namespace = self.prefix + "-ns"
        self.request("POST", native + "/namespaces", {"Name": namespace, "Annotations": {"vessel-smoke": "created"}})
        self.request("PUT", native + "/namespaces/" + namespace, {"Name": namespace, "Annotations": {"vessel-smoke": "updated"}})
        actual = self.request("GET", proxy + "/api/v1/namespaces/" + namespace)
        assert actual["metadata"]["annotations"]["vessel-smoke"] == "updated"
        deployment = {"apiVersion": "apps/v1", "kind": "Deployment", "metadata": {"name": "smoke", "namespace": namespace},
            "spec": {"replicas": 1, "selector": {"matchLabels": {"app": "smoke"}}, "template": {"metadata": {"labels": {"app": "smoke"}},
            "spec": {"containers": [{"name": "smoke", "image": "docker.io/library/alpine:3.22", "command": ["sh", "-c", "sleep 300"],
                                    "resources": {"requests": {"memory": "8Mi", "cpu": "10m"}, "limits": {"memory": "32Mi", "cpu": "100m"}}}]}}}}
        route = proxy + "/apis/apps/v1/namespaces/" + namespace + "/deployments"
        self.request("POST", route, deployment)
        wait_for(lambda: self.request("GET", route + "/smoke").get("status", {}).get("availableReplicas") == 1, timeout=120)
        actual = self.request("GET", route + "/smoke")
        actual["spec"]["template"]["metadata"]["annotations"] = {"vessel-smoke": "updated"}
        self.request("PUT", route + "/smoke", actual)
        assert self.request("GET", route + "/smoke")["spec"]["template"]["metadata"]["annotations"]["vessel-smoke"] == "updated"
        assert self.request("GET", native + "/applications?namespace=" + namespace)
        self.request("DELETE", route + "/smoke", {"propagationPolicy": "Foreground"})
        wait_for(lambda: not self.request("GET", route)["items"])
        manifest = json.dumps({"apiVersion": "v1", "kind": "ConfigMap", "metadata": {"name": "stack-smoke", "namespace": namespace}, "data": {"value": "created"}})
        self.request("POST", f"/stacks/create/kubernetes/string?endpointId={endpoint}",
            {"StackName": self.prefix + "-stack", "Namespace": namespace, "StackFileContent": manifest})
        stack = next(item for item in self.request("GET", "/stacks") if item["Name"] == self.prefix + "-stack")
        sid = stack["Id"]
        cm_route = proxy + f"/api/v1/namespaces/{namespace}/configmaps/stack-smoke"
        wait_for(lambda: self.request("GET", cm_route).get("data", {}).get("value") == "created")
        self.request("DELETE", f"/stacks/{sid}?endpointId={endpoint}")
        self.request("GET", cm_route, expected=404)
        self.request("DELETE", native + "/namespaces", [namespace])
        wait_for(lambda: not any(item["metadata"]["name"] == namespace for item in self.request("GET", proxy + "/api/v1/namespaces")["items"]))
        self.request("DELETE", f"/endpoints/{endpoint}")
        forward.terminate()
        forward.wait(timeout=10)
        self.processes.remove(forward)
        command(self.args.kind, "delete", "cluster", "--name", cluster, "--kubeconfig", str(kubeconfig))
        self.clusters.remove(cluster)
        self.docker("network", "rm", network)
        self.networks.remove(network)
        return {"version": version, "namespace_crud": "passed", "deployment_crud": "passed", "stack_create_delete": "passed", "environment_create_delete": "passed"}

    def release_resources(self):
        failures = []
        for process in self.processes:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=10)
        self.processes.clear()
        for name in reversed(self.containers[:]):
            try:
                self.remove(name)
            except Exception:
                failures.append(name)
        for cluster in self.clusters[:]:
            try:
                command(self.args.kind, "delete", "cluster", "--name", cluster, "--kubeconfig", str(self.root / "kubeconfig"))
                self.clusters.remove(cluster)
            except Exception:
                failures.append(cluster)
        for name in reversed(self.networks[:]):
            try:
                self.docker("network", "rm", name)
                self.networks.remove(name)
            except Exception:
                failures.append(name)
        for name in reversed(self.volumes[:]):
            try:
                self.docker("volume", "rm", name)
                self.volumes.remove(name)
            except Exception:
                failures.append(name)
        return failures

    def cleanup(self):
        self.results["cleanup_failures"] = self.release_resources()
        self.tmp.cleanup()

    def execute(self):
        try:
            for suite in self.args.suites.split(","):
                print(f"Running {suite} ({self.prefix})", flush=True)
                start = time.monotonic()
                try:
                    result = self.suite_engine(suite) if suite in ("docker", "swarm", "podman") else getattr(self, "suite_" + suite)()
                    self.results["suites"][suite] = {"status": "passed", "checks": result}
                except KeyboardInterrupt:
                    self.results["suites"][suite] = {"status": "interrupted"}
                    raise
                except ExternalGate as error:
                    self.results["suites"][suite] = {"status": "blocked", "gate": str(error)}
                    print(f"{suite}: BLOCKED: {error}", flush=True)
                except Exception as error:
                    self.results["suites"][suite] = {"status": "failed", "error": str(error)}
                    print(f"{suite}: FAILED: {error}", flush=True)
                    # Release this suite's containers before proceeding to heavier infrastructure.
                    failures = self.release_resources()
                    if failures:
                        raise RuntimeError("Unable to release own test resources: " + ", ".join(failures))
                failures = self.release_resources()
                if failures:
                    raise RuntimeError("Unable to release own test resources: " + ", ".join(failures))
                self.results["suites"][suite]["seconds"] = round(time.monotonic() - start, 1)
        finally:
            self.cleanup()
            Path(self.args.output).write_text(json.dumps(self.results, indent=2) + "\n")
        print("Results: " + self.args.output, flush=True)
        if any(s["status"] == "failed" for s in self.results["suites"].values()) or self.results["cleanup_failures"]:
            return 1
        return 2 if any(s["status"] == "blocked" for s in self.results["suites"].values()) else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--binary", "--artifact", required=True, help="Linux Vessel binary matching the Docker server architecture")
    parser.add_argument("--expected-release", default=(Path(__file__).resolve().parents[2] / "RELEASE_VERSION").read_text().strip())
    parser.add_argument("--expected-datastore", default="2.45.0")
    parser.add_argument("--runtime-image", default="vessel-issues-toolkit:arm64", help="Local image containing the binary's runtime/tool dependencies; never built or published here")
    parser.add_argument("--dind-image", default="docker:29-dind")
    parser.add_argument("--podman-image", default="quay.io/podman/stable:v5.8.1")
    parser.add_argument("--agent-image", default="portainer/agent:2.45.0")
    parser.add_argument("--dex-image", default="ghcr.io/dexidp/dex:v2.45.1")
    parser.add_argument("--playwright-module", help="Path to an installed Playwright Node package (OAuth browser suite)")
    parser.add_argument("--chrome", help="Chrome executable; otherwise use Playwright's managed Chromium")
    parser.add_argument("--frontend-standalone", help="Optional Next .next/standalone artifact root; a disposable copy exercises the real frontend OAuth callback")
    parser.add_argument("--htpasswd", default=shutil.which("htpasswd") or "htpasswd")
    parser.add_argument("--oauth-screenshot", help="Optional final success-page screenshot path (never captures password/token forms)")
    parser.add_argument("--kind", default=shutil.which("kind") or "kind")
    parser.add_argument("--kind-image", default="kindest/node:v1.35.0")
    parser.add_argument("--suites", default="docker,swarm,podman")
    parser.add_argument("--output", default="/tmp/vessel-rest-platform-results.json")
    args = parser.parse_args()
    if any(suite not in SUITES for suite in args.suites.split(",")):
        parser.error("--suites must be a comma-separated subset of " + ",".join(SUITES))
    if not Path(args.binary).is_file():
        parser.error("--binary must point to an existing Linux Vessel executable")
    previous = signal.getsignal(signal.SIGTERM)
    def terminate(_signum, _frame):
        raise KeyboardInterrupt
    signal.signal(signal.SIGTERM, terminate)
    try:
        return Smoke(args).execute()
    except KeyboardInterrupt:
        return 130
    finally:
        signal.signal(signal.SIGTERM, previous)


if __name__ == "__main__":
    sys.exit(main())
