# Stack image updates

Arcane/Watchtower-inspired Docker stack updates. Explicit refresh checks running
container/Swarm service image digests through Vessel's registry adapter. A
confirmed manual action repulls the stack's current image references and
redeploys through the existing stack handler, retaining Compose inputs,
environment values and secret resolution.

The host can run opt-in background checks while the browser is closed. Configure
monitor-only or automatic mode with a 5–1440 minute interval. The scheduler wakes
once per minute; a due job checks at most 100 workloads with four concurrent
registry checks and a 30-second read budget. Automatic mode deploys only when an
image is outdated and all workload policies/statuses allow it. It never selects
new semantic-version tags or removes images/volumes.

The following labels are respected:

- `com.centurylinklabs.watchtower.enable=false`: exclude.
- `com.centurylinklabs.watchtower.monitor-only=true`: monitor without deployment.
- `com.getarcaneapp.arcane.update-check=false`: exclude.
- `io.vesselhq.updates.enabled=false`: exclude.

Because deployment is stack-wide, an excluded or monitor-only workload blocks
the entire stack's repull. No partially updated Compose project is attempted.
Unknown, skipped, preparing or failed registry checks block automatic updates.

The development manifest targets environment 1 / stack 1. Adjust and review its
explicit `stacks.images.read`, `stacks.images.update`,
`stacks.images.configure` and `stacks.images.auto-update` grants before use.
Background checks are disabled until explicitly configured; automatic mode also
requires the update grant. The configuring user must remain an administrator.
Each run rechecks package approval, scopes and current stack access. Disable and
package replacement turn the policy off. Last-check/outcome state persists in
the registration; errors and audit records contain no configuration secrets.
There is one policy/target per registration. This single-server scheduler has no
HA leader election or cross-instance lease.

There is no image-age delay, version-tag selection, notification integration,
per-workload rolling policy or automatic rollback in this version. Deployment
acceptance is distinct from successful completion. Start with monitor-only mode
and verify your environment's deployment behavior before enabling automation.

Pack and isolated-build through [the builder](../../../scripts/native-extensions/README.md).
No third-party Watchtower/Arcane daemon, Docker socket mount or backend binary is
added by this extension.
