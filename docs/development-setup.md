# Development Setup Guide

This guide covers the shortest path to running Portainer CE locally for
development.

## Prerequisites

Install:

- Docker
- Go 1.26.10
- Node.js 24.21.0 or newer in the 24.x LTS line
- pnpm 10.26.2

Docker must be running because the development server runs Portainer in a local
container and mounts the Docker socket.

## Install dependencies

```sh
make deps
```

## Start the development environment

```sh
./launch-dev.sh
```

This builds the server, starts the Portainer container, installs frontend
dependencies if needed, and starts the frontend development server.
The script can be run from any working directory. `make dev` remains available
when you are in the repository root.

Default local URLs:

- Portainer server: <https://localhost:9443>
- Frontend dev server: <http://localhost:8999>

`npm run dev` also starts the local development backend when it is not already
available, loads the ignored root `.env`, and enables development auto-login.
Use `npm run dev:frontend` when the backend is already managed separately.

## Run server and client separately

Use separate targets when you want independent terminal sessions:

```sh
make dev-server
make dev-client
```

`make dev-server` rebuilds the server binary and starts a container named
`portainer`. `make dev-client` runs the frontend development server.

## Native extension development instance

The prepared machine's normal `http://localhost:8999` instance now contains the
approved Network Overview and Persistent Notes examples. Open
`/1/docker/stacks/extension-network-demo?regular=true&type=2&id=1` for the extension-specific inline
Network overview card between Stack details and Containers. The test stack's web service and request generator publish
no ports. The console on port 19000 is an earlier separate standalone reference
runtime with a different datastore; installing there does not install on 8999.

The approved set is selected only after an isolated complete frontend build and
integrity checks. A fresh checkout/backend needs its own upload, explicit grants
and compiled selection; see the [extension guide](native-extensions.md). The
current generated modules are local development selection, not a production
activation mechanism.

The normal backend also has one shared private mTLS Unix gateway for Go service
notes, using the `vessel-extension-dev-gateway-20261016` Docker volume. An SDK
container uses that socket with its own package-bound client identity, without
Docker socket access or a published service port. This manually configured local
gateway is not automatically recreated by the generic dev-server launcher.
Its certificates are short-lived development fixtures; production identity
issuance and managed lifecycle are future work. No credentials are committed.

## Useful development settings

The frontend launcher enables `DEV_AUTO_LOGIN=true`. Set server-only
`DEV_AUTO_LOGIN_USERNAME` and `DEV_AUTO_LOGIN_PASSWORD` in the ignored `.env`
or process environment. Auto-login is enabled only in development. When using
a separately managed backend without Docker, set
`DEV_AUTO_CREATE_LOCAL_ENVIRONMENT=false` to sign in without automatically
provisioning a local Docker endpoint; the default still provisions it.

The server container script supports these environment variables:

- `PORTAINER_DATA`: host directory or volume used for Portainer data. Defaults
  to `/tmp/portainer-ce`.
- `PORTAINER_PROJECT`: repository root mounted into the container. Defaults to
  the current directory.
- `PORTAINER_FLAGS`: extra flags passed to the Portainer binary.

Example:

```sh
PORTAINER_DATA=$HOME/.portainer-dev PORTAINER_FLAGS="--log-level=DEBUG" make dev-server
```

Run `make help` for the full list of development, test, lint, and build targets.
