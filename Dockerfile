FROM node:24.21.0-alpine AS node-runtime

FROM portainer/base:latest AS production

ARG TARGETARCH
ARG COMPOSE_UNPACKER_IMAGE=themodcrafttmc/compose-unpacker:2.39.3.2.3
ENV COMPOSE_UNPACKER_IMAGE=${COMPOSE_UNPACKER_IMAGE}
ENV HOSTNAME=127.0.0.1 \
  PORT=8999 \
  PORTAINER_FRONTEND_ORIGIN=http://127.0.0.1:8999

LABEL org.opencontainers.image.title="Vessel HQ" \
  org.opencontainers.image.description="Vessel HQ container management for Docker, Kubernetes, and Swarm." \
  org.opencontainers.image.vendor="TheModCraft" \
  com.docker.desktop.extension.api.version=">= 0.2.2" \
  com.docker.extension.detailed-description="<p>Vessel HQ provides a focused interface for managing Docker, Kubernetes, and Swarm environments.</p><ul><li>Inspect containers and logs</li><li>Open container consoles</li><li>Deploy applications and stacks</li><li>Manage reusable templates</li></ul>"

COPY dist/mustache-templates /mustache-templates/
COPY --chmod=0755 dist/portainer-${TARGETARCH} /portainer
COPY --from=node-runtime /lib/ld-musl-*.so.1 /lib/
COPY --from=node-runtime /usr/lib/libstdc++.so.6 /usr/lib/
COPY --from=node-runtime /usr/lib/libgcc_s.so.1 /usr/lib/
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY dist/next /next/
COPY build/next-entrypoint.js /next-entrypoint.js

COPY build/docker-extension /

# storybook exists only in portainerci builds
COPY dist/storybook* /storybook/

VOLUME /data
WORKDIR /

EXPOSE 9000
EXPOSE 9443
EXPOSE 8000

ARG GIT_COMMIT=unspecified
ARG BUILD_DATE=unspecified
LABEL git_commit=$GIT_COMMIT \
  org.opencontainers.image.revision=$GIT_COMMIT \
  org.opencontainers.image.created=$BUILD_DATE \
  org.opencontainers.image.title="Vessel HQ" \
  org.opencontainers.image.description="Vessel HQ container management server." \
  org.opencontainers.image.vendor="TheModCraft" \
  io.portainer.server="true"

ENTRYPOINT ["/usr/local/bin/node", "/next-entrypoint.js"]
