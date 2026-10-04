FROM node:22.22.1-alpine AS node-runtime

FROM portainer/base:latest

ARG TARGETARCH
ARG COMPOSE_UNPACKER_IMAGE=themodcrafttmc/compose-unpacker:2.39.3.2.3
ARG GIT_COMMIT=unspecified
ARG BUILD_DATE=unspecified
ARG RELEASE_VERSION=unspecified
ENV COMPOSE_UNPACKER_IMAGE=${COMPOSE_UNPACKER_IMAGE}
ENV HOSTNAME=127.0.0.1 \
  PORT=8999 \
  PORTAINER_FRONTEND_ORIGIN=http://127.0.0.1:8999

LABEL org.opencontainers.image.title="Vessel HQ" \
  org.opencontainers.image.description="Vessel HQ container management server." \
  org.opencontainers.image.vendor="TheModCraft" \
  org.opencontainers.image.version=$RELEASE_VERSION \
  org.opencontainers.image.revision=$GIT_COMMIT \
  org.opencontainers.image.created=$BUILD_DATE \
  io.portainer.server="true"

COPY --chmod=0755 ${TARGETARCH}/portainer /portainer
COPY --from=node-runtime /lib/ld-musl-*.so.1 /lib/
COPY --from=node-runtime /usr/lib/libstdc++.so.6 /usr/lib/
COPY --from=node-runtime /usr/lib/libgcc_s.so.1 /usr/lib/
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY next /next/
COPY next-entrypoint.js /next-entrypoint.js
COPY mustache-templates /mustache-templates/

VOLUME /data
WORKDIR /
EXPOSE 8000 9000 9443
ENTRYPOINT ["/usr/local/bin/node", "/next-entrypoint.js"]
