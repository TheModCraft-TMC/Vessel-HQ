# Optional active/standby HA

Issue #299's HA mode is opt-in: `VESSEL_HA_MODE=shared-storage`. An unset value
or `disabled` preserves normal single-instance startup. Unknown values fail
startup. HA does not enable itself when another Vessel instance is discovered.

Two identical Vessel processes share the **entire same `/data` filesystem**.
One holds `.vessel-ha.lock` for its process lifetime. The other waits before
filesystem initialization, database encryption, backup, migrations, background
schedulers, gRPC or HTTP listeners. After the active process exits and storage
releases its lock, the standby acquires it and starts normally. Local lock retries
occur every 250 ms; storage failure detection, lock recovery and application
startup add to the actual recovery time. The promoted process uses a new JWT
signing key, so browser users must sign in again and reopen live streams. There
is no automatic failback preference.

The backend remains single-writer BoltDB. This is not database replication or
active/active serving. Storage must provide coherent cross-host exclusive locks,
memory-mapped file access and crash recovery. A shared folder label, replicated
copies of `/data`, or a generic RWX claim does not establish those properties.
Do not remove, rename or replace `.vessel-ha.lock`, including during standby
startup. If a failed host retains ownership, promotion waits for safe lock
recovery; it does not force another writer. Network partition safety requires
storage fencing, provided and validated by the storage platform. Kubernetes
Lease election or a virtual IP alone cannot supply that fencing.

Both instances must use the same immutable application image, encryption secret
(when used), extension packages and gateway configuration. Keep credentials in
the existing secret system. An HA pair should manage Docker hosts through stable
remote agents or authenticated APIs; a local Docker socket would change which
engine an environment means after a takeover.

## Kubernetes

[Example manifest](../examples/ha/kubernetes.yaml) runs two replicas on separate
nodes with one existing shared claim. Replace its deliberately invalid image
placeholder with the reviewed immutable image. Size the resource requests and
limits for your environment count and workload. Supply secrets and ingress
appropriate to your cluster. For in-cluster Kubernetes management, explicitly opt
in to token mounting with a dedicated service account and the required RBAC.
The example disables token mounting by default. Readiness checks route traffic
only to the process actually serving the API. Standbys intentionally have no API
listener, so an API liveness probe must not be copied onto both replicas.
An unavailable active process that has not exited must be fenced or restarted
by infrastructure before takeover. `Recreate` updates stop the old pair before
starting a different application version and include a management outage.

## Two Docker hosts or VMs

Deploy the [separate Compose example](../examples/ha/compose.yaml) on each host,
setting `VESSEL_HA_IMAGE` to the same immutable image and mounting the same
storage. The bind mount refuses to create a missing local directory, reducing
the chance of starting a separate empty database. The existing front door must
health-check HTTPS `/api/status` on each host and route HTTPS and the Edge TCP
tunnel to the active host. Port 8000 cannot be routed to the waiting standby.
No existing development or production Compose file is changed by this example.

## Verification and limits

Unit tests cover disabled mode, invalid configuration, exclusive ownership,
cancellable standby waits, takeover after release and release on abrupt process
exit. They do not establish cross-host filesystem behavior, Kubernetes node
eviction, Docker-host failure detection, load-balancer convergence, reconnects
or partition fencing. Treat this mode as experimental until those tests pass
on the selected storage and infrastructure. Upstream's
[deployment reference](https://architecture.portainer.io/ch2) also identifies
the embedded database's single-writer constraint; platform rescheduling is
separate from horizontal API scaling.
