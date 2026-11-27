#!/bin/bash
set -euo pipefail

PORTAINER_DATA=${PORTAINER_DATA:-/tmp/portainer-ce}
PORTAINER_PROJECT=${PORTAINER_PROJECT:-$(pwd)}
PORTAINER_FLAGS=${PORTAINER_FLAGS:-}
PORTAINER_BIND_ADDRESS=${PORTAINER_BIND_ADDRESS:-127.0.0.1}
PORTAINER_HTTP_PORT=${PORTAINER_HTTP_PORT:-9000}
PORTAINER_HTTPS_PORT=${PORTAINER_HTTPS_PORT:-19443}
PORTAINER_TUNNEL_PORT=${PORTAINER_TUNNEL_PORT:-18000}

docker rm -f portainer >/dev/null 2>&1 || true

docker run -d \
  -p "$PORTAINER_BIND_ADDRESS:$PORTAINER_TUNNEL_PORT:8000" \
  -p "$PORTAINER_BIND_ADDRESS:$PORTAINER_HTTP_PORT:9000" \
  -p "$PORTAINER_BIND_ADDRESS:$PORTAINER_HTTPS_PORT:9443" \
  -v "$PORTAINER_PROJECT/dist:/app" \
  -v "$PORTAINER_DATA:/data" \
  -v /var/run/docker.sock:/var/run/docker.sock:z \
  -v /var/run/docker.sock:/var/run/alternative.sock:z \
  -v /tmp:/tmp \
  -e CSP=false \
  --name portainer \
  portainer/base \
  /app/portainer \
  --log-level=DEBUG \
  --no-setup-token \
  $PORTAINER_FLAGS
