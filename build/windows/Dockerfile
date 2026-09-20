ARG OSVERSION=ltsc2022
ARG BUILDPLATFORM
FROM --platform=${BUILDPLATFORM} gcr.io/k8s-staging-e2e-test-images/windows-servercore-cache:1.0-linux-amd64-${OSVERSION} AS core

FROM mcr.microsoft.com/windows/nanoserver:${OSVERSION} AS production

COPY --from=core /Windows/System32/netapi32.dll /Windows/System32/netapi32.dll

USER ContainerAdministrator

COPY dist/mustache-templates /mustache-templates/
COPY dist/portainer.exe /
COPY dist/public /public/

# storybook exists only in portainerci builds
COPY dist/storybook* /storybook/

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

ENTRYPOINT ["/portainer.exe"]
