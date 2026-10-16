# Native UI with a packaged Go backend

This manifest template packages the real Go gRPC example as a Linux backend
executable alongside the native UI. A Rust binary can use the same descriptor and
protobuf contract. Backend payloads are inert on upload; service deployment and
execution require a separate runtime integration.

Prepare a new temporary package directory from the repository root:

```sh
mkdir -p /tmp/vessel-summary-service/backend/linux-amd64
cp examples/native-extensions/environment-summary-service/manifest.json /tmp/vessel-summary-service/manifest.json
cp -R examples/native-extensions/environment-summary/ui /tmp/vessel-summary-service/ui
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags='-s -w' \
  -o /tmp/vessel-summary-service/backend/linux-amd64/extension \
  ./backend-src/cmd/vessel-extension-example
node scripts/native-extensions/builder.mjs digest /tmp/vessel-summary-service
```

Replace `packageDigest` in the temporary manifest with the printed value. Review
the environment scope `[1]` and change it to your intended environment if needed.
Changing the manifest does not change the source inventory digest, but changes
the independently bound manifest digest and invalidates previous approval.

```sh
node scripts/native-extensions/builder.mjs pack /tmp/vessel-summary-service /tmp/environment-summary-service.vesselhq
```

Upload that `.vesselhq` file through the administrator extension screen and review
its native UI trust and scoped service-read requests. It contains a genuine ELF64
binary built from the repository's Go example, not a shell script. No binary or
credentials belong in the repository. An optional ARM64 entry uses
`backend/linux-arm64/extension` and `GOARCH=arm64`.

The executable reads metadata when launched with `--address`, `--ca`, `--cert`,
`--key`, and `--environment-id` as documented in the
[Go client guide](../../../backend-src/cmd/vessel-extension-example/README.md).
It is a one-shot reference service client, not a managed daemon. Issue a client
identity for `environment-summary-service` and its newly calculated digest;
identities for the UI-only example do not authorize this different package.
