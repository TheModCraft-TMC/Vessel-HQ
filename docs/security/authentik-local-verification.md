# Disposable local Authentik verification

## Result and exact scope

**PASS — 2026-10-22.** Four fresh isolated browser contexts completed real
Authentik username/password authentication and the OAuth authorization-code flow
against the actual Vessel API. The bounded run finished in **85.2 seconds**.
No product source change was needed.

This used a **companion callback page**, not the production frontend. The callback
validated its generated state and passed the real browser authorization code to
`POST /api/auth/oauth/validate`. A local observation relay forwarded Authentik's
unmodified token and UserInfo responses to Vessel. It recorded only safe status,
token-presence flags, and synthetic identity/group observations; it did not mint,
replace, or export tokens. No password grant or login bypass was used.

### Artifact and tools

- Vessel release **1.3.1**, API/datastore **2.45.0**, Go **1.26.10**.
- Backend source identity: `61c04c69338b3bcea37c74579c2d506e646197d1`;
  Linux ARM64 executable SHA-256:
  `d2d2a8e13a102c4cc24fd26e3649d4bca8115001704cbf4c638183467f0081ca`.
- Existing local `vessel-rest-toolkit:arm64` runtime image ID:
  `sha256:63e444b3e7dbd0c4c163f63bc816858885de2c1649f38ab58b1e59a2bf6b73f1`.
- Actual provider version **Authentik 2026.8.5**; actual PostgreSQL **16.14**.
- Chrome **155.0.8059.85**, Playwright **1.58.2**, Node.js **24.22.1**.
- Official Python observation image: **3.13-alpine** (image metadata reports
  `PYTHON_VERSION=3.13.17`). All three official images resolved to ARM64.

Official image references were digest-pinned:

| Component | Image | SHA-256 digest |
| --- | --- | --- |
| Authentik server and worker | `ghcr.io/goauthentik/server:2026.8.5` | `602227a86455d6772e3d16b7d852713c4f864f40df5df894abd1285bb53979a5` |
| Database | `postgres:16-alpine` | `e013e867e712fec275706a6c51c966f0bb0c93cfa8f51000f85a15f9865a28cb` |
| Observation relay | `python:3.13-alpine` | `c50ccfb66e5cc97a610dcd0b9597de6ef5b52c96280b51997b353a0fc87a8361` |

## Observed behavior

The confidential provider explicitly enabled `authorization_code`, used a strict
callback URI, the official `default-authentication-flow`, and
`default-provider-authorization-implicit-consent`. Its custom `vessel_groups`
scope returned `authentik_groups` from real Authentik group membership.
`include_claims_in_id_token` was disabled.

In **every phase**, the actual token endpoint returned HTTP 200 for an
`authorization_code` exchange, an access token and ID token were present, and
`authentik_groups` was **absent from the ID token**. The actual UserInfo endpoint
returned HTTP 200 with the expected custom groups, including an empty array in
phase 4. Thus the observed team synchronization used real UserInfo groups, not an
ID-token group claim or fabricated JWT.

| Phase | Authentik groups | Observed Vessel memberships |
| --- | --- | --- |
| Initial login | `vessel-operators`, `vessel-automation` | `operators` member + `automation` member; no fallback |
| Unchanged relogin | Same two groups | Existing `operators` leader preserved; `automation` member and manually added unmanaged `manual` member preserved |
| Changed groups | `vessel-readers` | Both stale managed teams removed; `readers` member added; `manual` member preserved |
| Empty groups | None | Managed `readers` membership removed; configured `fallback` member added; `manual` member preserved |

All four callbacks resolved to the **same Vessel user ID**, with global
**standard-user role (2)** and exactly the expected memberships, without duplicate
memberships. Each phase separately received **HTTP 403** for standard-user
`GET /api/settings`, `PUT /api/settings`, and `POST /api/teams`.

The existing [OAuth implementation](../../backend-src/api/oauth/oauth.go) and
[team-sync regression tests](../../backend-src/api/http/handler/auth/oauth_team_sync_test.go)
remain unchanged. This run does not separately test conflicting ID-token versus
UserInfo usernames; the existing ID-token-first identity contract was not altered.

## Resource isolation and cleanup

The run owned five exact container names, one uniquely labeled bridge network,
and one database volume. Only random host **127.0.0.1** ports were published. No
host runtime socket was mounted; no host Swarm/kubecontext/global settings were
changed. The bridge was **not an outbound-egress firewall**. Authentik update
checks and error reporting were disabled; all accounts and credentials were
synthetic and generated for this disposable run.

| Container | Enforced memory / CPU cap | Observed cgroup memory peak (bytes) |
| --- | --- | ---: |
| PostgreSQL | 256 MiB / 1 CPU | 180531200 |
| Authentik server | 1280 MiB / 2 CPUs | 434798592 |
| Authentik worker | 1024 MiB / 2 CPUs | 346624000 |
| Vessel | 384 MiB / 1 CPU | 92602368 |
| Observer | 64 MiB / 0.5 CPU | 20799488 |

Total container memory caps were **3008 MiB** on an **8321515520-byte** ARM64
Docker VM. The sum of individual cgroup peaks was approximately **1025.54 MiB**;
this is not a measured simultaneous peak. All five containers were running with
`OOMKilled=false` at the final sample. Host Swarm was `inactive` before and after.

The launcher enforced a **1200-second alarm**, bounded subprocess/cleanup timeouts,
and exact-name cleanup. The final report had `cleanup_failures: []`, no remaining
owned containers/volumes/networks, and `private_scratch_removed: true`. A fresh,
independent exact-label inventory also found none. Secret-bearing private scratch
files were removed. Docker logs were disabled. No trace, HAR, video, login
screenshot, full URL/query/body, credential, authorization code, token, or browser
session was exported or committed.

## Repeat and evidence handoff

The reviewed launcher remains **uncommitted private scratch tooling**, not a
repository dependency:

- Launcher: `/tmp/vessel-authentik-verify-notes/run_authentik_v8.py`.
- Launcher SHA-256: `c7d83a6a17bcb338e005a67b073722addcb5da4607de58eb852eb53b61ac50bd`.
- Successful safe report and log: `proof.json` and `run.log` under
  `/var/folders/t9/gvw3kssx763dpxz6ss4_gv_h0000gn/T/vessel-authentik-managed-v8-v9qw3jlz/`.
- Report SHA-256: `9f9d49733a21525fe0d3d18525fb63a680b7c5d9dbeacdd9c417a01985b0bfdb`.

Those are local handoff paths, not permanent published artifacts. The report/log
are mode `0600` inside a mode `0700` directory. Repeat in a managed terminal with
the existing Docker runtime, browser/tools, reviewed launcher, and exact binary:

```sh
umask 077
report_dir=$(mktemp -d "${TMPDIR:-/tmp}/vessel-authentik-repeat.XXXXXX")
chmod 700 "$report_dir"
python3 /tmp/vessel-authentik-verify-notes/run_authentik_v8.py \
  --binary /tmp/vessel-rest-r4-61c04c693-linux-arm64 \
  --runtime-image vessel-rest-toolkit:arm64 \
  --output "$report_dir/proof.json" > "$report_dir/run.log" 2>&1
```

Always use a fresh private report directory. SIGKILL/host failure cannot guarantee
cleanup: inspect the report's exact owned names/labels if interrupted; do not use
global prune. Prior failed runs are not successful coverage. The final fixture
fix was to wait for the actual password-stage input rather than prematurely
filling the identification stage's password-manager field; no forced click,
provider-policy relaxation, or product fix was needed.

**Not covered:** the production frontend callback, external deployment policy,
MFA/federation, per-environment or per-stack ACLs, Azure ACI, Windows/npipe, or any
other backend artifact. Independent Dex/production-frontend evidence is separate
and is not relabeled as Authentik frontend coverage.
