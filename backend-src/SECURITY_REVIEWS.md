# Backend Sonar finding dispositions

Scope: the 30 backend findings in the combined GitHub issue inventory, based on
`5b175344b`. These are source-level reviews, not a claim that a remote SonarCloud
analysis or hotspot workflow has been updated. `NOSONAR` annotations are confined
to the reviewed expressions below; no file-wide/rule-wide exclusion is used.
They do not exempt new call sites or unrelated security rules from review.

## Defects fixed

| GitHub issue | Rule | Change |
| --- | --- | --- |
| #186, #187, #188, #189 | go:S5547 | Remove all four TLS 1.2 CBC suites. Also remove static-RSA suites, duplicate ChaCha aliases and inapplicable TLS 1.3 entries. Keep only ECDHE + AEAD for TLS 1.2; Go manages TLS 1.3 suites. FIPS policy remains unchanged. |
| #229 | godre:S8239 | Derive graceful-shutdown context from `context.WithoutCancel(shutdownCtx)` with a fresh 30-second deadline. Directly using the already-canceled shutdown context would abort graceful draining. |
| #149 | godre:S8239 | Derive inline deployment context from `context.WithoutCancel(ctx)` with the existing deployment timeout. Retain values without abandoning a deployment on browser disconnect and orphaning cluster resources. |
| #159 | godre:S8239 | Derive the `WithCli` context from the caller with `context.WithoutCancel`: values are preserved, while cancellation is detached as before so client disconnects or the 30s Next.js rewrite timeout cannot interrupt `compose down` during stack stop/delete. |
| #168, #169, #170 | godre:S8188 | Defer scheduler test timeout cancellation immediately, including failure/unused-job paths. |
| #160, #161 | godre:S8188 | Defer Swarm test timeout cancellation immediately. Existing `t.Cleanup(cancel)` was safe but less explicit to the analyzer. |
| #147 | godre:S8188 | Defer pod-log test cancellation in addition to simulating client cancellation in the reader. |

Tests exercise TLS 1.2 AEAD success, CBC/static-RSA refusal, TLS 1.3 success,
shutdown draining, CLI context identity/cancellation and detached bounded deployment
with preserved values. Integration-tag-independent Swarm tests do not imply live
Swarm deployment coverage.

## Intentionally retained behavior, reviewed at the expression

### Loopback Edge tunnel HTTP — go:S5332

| GitHub issue | Reviewed call site |
| --- | --- |
| #179 | `api/chisel/service.go`: `pingAgent` |
| #180 | `api/docker/client/client.go`: Edge Docker client URL |
| #181 | `api/http/handler/websocket/proxy.go`: Edge WebSocket URL |
| #182 | `api/http/proxy/factory/agent.go`: Edge agent URL |
| #183 | `api/http/proxy/factory/docker.go`: Edge Docker proxy URL |
| #184 | `api/http/proxy/factory/kubernetes.go`: Edge Kubernetes proxy URL |
| #185 | `api/kubernetes/cli/client.go`: Edge Kubernetes client URL |

These URLs use `ReverseTunnelService.TunnelAddr`, whose production implementation
in `api/chisel/tunnel.go` returns **127.0.0.1 plus the local tunnel port**, not the
remote agent's network address. HTTP/WebSocket is the inner protocol transported
through the authenticated, encrypted Chisel/SSH reverse tunnel. Chisel uses the
server's persisted private key, exposes its fingerprint for agents, and installs
per-agent tunnel credentials restricted to loopback (`api/chisel/service.go`).
Replacing these inner URLs with HTTPS would require TLS on the loopback tunnel
entry/remote inner HTTP service and break existing Edge connectivity; it would not
secure the already-encrypted outer channel. Preserve existing TLS settings where
supported; do not disable TLS verification for ordinary external integrations.
The HTTP proxy and Docker client branches still select HTTPS from endpoint TLS
configuration. Edge WebSockets remain inner `ws` over the encrypted tunnel.
Local Docker Unix-socket and Windows named-pipe transports are unchanged: their
HTTP framing runs over local IPC, not a cleartext external TCP connection, and
forcing HTTPS would break those workflows. The listed findings are specifically
Edge tunnel URLs, not grounds for replacing local socket transport.

During this review the local CLI-to-agent signing proxy was found to bind `:0`
(all interfaces). It now explicitly binds **127.0.0.1:0**. That separate real
exposure is fixed rather than hidden by an HTTP exception. A test checks the
actual listener's bound IP, not just whether a localhost request succeeds.

### WebSocket URL parsing — #177, go:S5332

`api/http/handler/websocket/proxy.go` supplies a scheme so `url.Parse` treats the
Kubernetes agent address as a host. No HTTP request is made with that URL.
`doProxyWebsocketRequest` subsequently replaces the scheme with `wss` when the
endpoint TLS settings enable TLS (or certificate-verification bypass), and `ws`
for intentionally configured non-TLS endpoints. Forcing HTTPS at the parsing step
would not determine the actual wire protocol and must not replace that policy.

### URL validation — #175, go:S5332

`pkg/validate/validate.go` prefixes schemeless strings with a parsing placeholder
to detect a host. `IsURL` does not issue requests or return the prefixed URL.
It must continue to recognize explicitly configured HTTP integrations and
schemeless hosts. This is not a cleartext transport vulnerability.

### OAuth fixture URLs — #212, #213, #214, #215, go:S5332

The four `api/oauth/oauthtest/oauth_server.go` URLs address a loopback
`httptest.NewUnstartedServer` listener. They carry test-only codes/tokens and
exercise the OAuth HTTP flow in an isolated fixture, not production credentials.
Changing the strings to HTTPS without a TLS server/client trust setup breaks the
fixture; requiring TLS here does not improve production OAuth configuration.

### Session cookie policy — #191, #192, go:S2092

`api/http/security/bouncer.go` does not omit the `Secure` field. It sets it from
the `secure` argument for **both setting and expiring** the cookie. Authentication
and logout callers derive that argument from request TLS, HTTPS reverse-proxy
headers, or the administrator's `ForceSecureCookies` setting. Invalid-cookie
cleanup derives it from TLS/forwarded HTTPS. Cookies remain HttpOnly,
SameSite=Strict and path `/`. A regression test asserts true and false transport
policies for both issuance and deletion (including expiry/MaxAge).

Unconditionally setting `Secure=true` would disable supported HTTP-only local
installations. Deployments carrying real credentials should use HTTPS and enable
`ForceSecureCookies` when appropriate, and must sanitize forwarded headers at
the reverse-proxy boundary. The exception is the explicit configurable HTTP
policy, not permission to omit security on HTTPS sessions.

### Historical backup key derivation — #172, go:S5344

`api/crypto/aes.go`'s scrypt(N=32768, r=8, p=1, salt=nil) call exists **only in
`aesDecryptOFB`**, the pre-header archive restoration path. These parameters,
the empty salt and zero IV are part of an unversioned historical file format.
Increasing the work factor or adding a salt changes the derived key and makes
existing backups unreadable. No production encryption path calls this routine.
Current encryption uses salted Argon2id + AES-GCM, or PBKDF2-SHA256 (600,000
iterations, random salt) + AES-GCM in FIPS mode. The source no longer incorrectly
suggests that salt omission is generally acceptable. A fixed historical
ciphertext regression (not an encrypt/decrypt pair that could drift together)
protects compatibility. Legacy OFB archives do not provide authenticated
encryption; preserving restoration does not endorse that format for new writes.

### OAuth ID-token decoding — #211, go:S5659

`api/oauth/oauth.go` does **not verify a JWT signature with a weak cipher**.
`GetIdToken` decodes the ID token returned directly by the configured provider
from the authorization-code exchange. No request/body/query ID token is accepted
by this flow. The trust boundary is that direct provider backchannel, exactly as
for access tokens returned in the same response; production providers should
use HTTPS. OIDC Core 1.0 section 3.1.3.7 permits relying on token-endpoint TLS
validation instead of checking the ID-token signature for this code flow.
The generic OAuth settings do not supply an OIDC issuer/JWKS verification policy;
pretending `WithValidMethods` verifies a `ParseUnverified` result would be false
security, and deriving an untrusted discovery URL from token claims would add a
new trust/SSRF risk. Explicitly configured local HTTP providers retain the same
administrator-owned transport policy as other HTTP integrations.

The existing identity precedence is preserved: backchannel ID-token claims
overlay resource claims for username extraction, including providers whose
configured username claim exists only in the ID token. The **base commit already
clones resource claims before that merge**, so decoded ID-token claims do not
enter `OAuthIdentity.Claims`; this patch does not remove an existing group source.
`validateOAuth` passes `identity.Claims` to `syncOAuthTeamMemberships` when
`OAuthAutoMapTeamMemberships` is enabled, and the resolver reads the configured
`TeamMemberships.OAuthClaimName` (with regex mappings and optional default team).
That Authentik/resource group-sync contract is retained unchanged and tested
through the real OAuth service and team-sync function. Expanding authorization
claims to ID-token-only groups is a separate policy decision, not a Sonar fix.
Malformed/non-string token responses return errors rather than panic, and a null
resource response cannot panic during the identity-only merge. Tests cover
ID-token identity precedence, resource-only identity, null resources, malformed
ID tokens, resource groups reaching team sync, and the base exclusion of ID-token
groups. This helper is expressly documented as a decoder, not a verifier;
it must not be reused for caller-supplied tokens or authorization. A future full
OIDC verifier needs explicit issuer/audience/JWKS configuration and migration of
generic OAuth-only providers, not a silent incompatible rewrite of this parser.
