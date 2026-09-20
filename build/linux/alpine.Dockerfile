FROM alpine:latest AS production

LABEL org.opencontainers.image.title="Vessel HQ" \
    org.opencontainers.image.description="Vessel HQ container management for Docker, Kubernetes, and Swarm." \
    org.opencontainers.image.vendor="TheModCraft" \
    com.docker.desktop.extension.api.version=">= 0.2.2" \
    com.docker.extension.detailed-description="<p>Vessel HQ provides a focused interface for managing Docker, Kubernetes, and Swarm environments.</p><ul><li>Inspect containers and logs</li><li>Open container consoles</li><li>Deploy applications and stacks</li><li>Manage reusable templates</li></ul>"

COPY dist/mustache-templates /mustache-templates/
COPY dist/portainer /
COPY dist/public /public/

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

ENTRYPOINT ["/portainer"]
