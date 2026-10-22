# Stack network overview extension

This native React Flow extension adds **Network overview** inside its own collapsible card between Docker Stack details and Containers
(or Services). Its expandable drawer stays inside the stack page and shares the
neighboring cards’ alignment. It draws the selected stack's workloads and networks with a minimap,
zoom controls and an accessible network-attachments table. The host supplies the selected
environment/stack context; the extension calls `stacks.network.read` through the
permission-checked host broker and dedicated gRPC gateway. The Traffic flow
and Traefik config views additionally use the separately granted
`stacks.traffic.read` capability. Docker labels supply configured entrypoint →
router → service → workload paths and a filtered configuration projection.
Traffic flow uses a UniFi-inspired React Flow device map with branching paths,
workload RX/TX rates, live activity links and an inspector for selected devices.
Both canvases follow the console’s light, dark and high-contrast themes, including
controls and minimaps. Sensitive rules and middleware values are redacted. This is the label configuration,
not Traefik’s resolved runtime configuration.

Start live traffic opens a cancellable one-minute stream, checking current
authorization on every five-second sample. Docker network byte counters provide
receive/transmit rates for running Compose containers. HTTP request counts,
per-route throughput and latency require Traefik metrics or access logs; Swarm
task-level byte sampling remains future work. The extension publishes no ports.

The example manifest scopes access to development environment 1 and stack 1.
Adjust those scopes before uploading to another installation. It requests native
UI trust separately from the explicit environment/stack metadata permission.
It receives topology metadata, never Docker credentials, container environment
variables or a generic engine proxy. No extension backend binary is needed for
this host-provided operation.

```sh
pnpm test:extensions
node scripts/native-extensions/builder.mjs inspect examples/native-extensions/stack-network-overview
node scripts/native-extensions/builder.mjs pack examples/native-extensions/stack-network-overview /tmp/stack-network-overview.vesselhq
```

Use a new output path if the file already exists. Upload the `.vesselhq` package,
then review its exact digest, native trust request and stack-scoped grant in
Vessel's administrator extension screen. Upload and approval do not compile code.
The trusted development operator pipeline in
[the builder guide](../../../scripts/native-extensions/README.md) separately
builds in an isolated container and selects the verified native source. The
console then displays the action only when the matching native package is
compiled and currently approved. Removing the grant blocks subsequent reads.

The UI source, CSS Module and topology mapper are the packaged payload. README
and development test files remain outside the archive. Existing package and
source digests are stable when only tests/documentation change. Source changes
require calculating and reviewing a new digest, updating the manifest, uploading
again, and reviewing the new approval revision.

Production artifact distribution, background UI-driven builds, multi-package
upgrades and managed backend execution remain separate platform work. The
development pipeline does not claim to implement those deployment controls.
