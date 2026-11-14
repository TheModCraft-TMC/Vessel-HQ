# Signed webhook gateway

The gateway is optional. Set `VESSEL_WEBHOOK_GATEWAY_CONFIG` to a private regular
JSON file (0600, at most 1 MiB). An unset variable leaves the route unavailable.
A route contains an `id`, a secret of 32–1024 bytes, and 1–16 targets. Each target
has `kind` (`stack` or `service`) and the UUID token of an existing local webhook.
There may be 1–64 unique routes. Unknown configuration fields fail startup.
Keep the file and all webhook tokens in the existing secret system.

Send POST `/api/webhook-gateway/{id}` with a body of at most 64 KiB and headers:

- `X-Vessel-Timestamp`: canonical decimal Unix seconds, within five minutes.
- `X-Vessel-Delivery`: a unique 16–128 character delivery ID using letters,
  digits, underscore, dot or hyphen, starting with a letter or digit.
- `X-Vessel-Signature`: `sha256=` followed by the hex HMAC-SHA256, keyed by the
  route secret, over the exact bytes
  `routeId + "\n" + timestamp + "\n" + delivery + "\n" + body`.

Do not include query parameters. The gateway drops caller payloads and credentials
before invoking its configured local targets. Requests cannot select arbitrary
URLs or modify the target list. Put TLS termination and ingress request limits
in front of the application as for other webhook endpoints. Configuration changes
and secret rotation take effect on process restart; an HA pair needs identical
configuration on both processes.

The gateway records a durable reservation before any deployment. A repeated
route/delivery ID returns 409, including after restart. Completion returns counts
only: 202 when all targets succeed, 502 for partial failure. Audit persistence
failure returns 503.

The gateway allows at most 16 concurrent accepted requests. A busy gateway returns
429 before reserving the delivery, so that response can be retried with the same ID.
Dispatch has a two-minute context deadline; an existing target
handler must also honor cancellation. Activity records contain route/delivery IDs,
a body digest and outcome counts, never webhook tokens, signatures or bodies.

This is at-most-once acceptance, with no automatic retry or guaranteed delivery.
A client disconnect or crash after reservation can leave an unattempted or partially
attempted delivery. Inspect activity and target state before retrying under a new
ID. Retain acceptance audit records longer than the signature validity window;
do not delete them while accepted requests could still be replayed. A failed
completion audit does not make a reserved delivery safe to retry automatically.
