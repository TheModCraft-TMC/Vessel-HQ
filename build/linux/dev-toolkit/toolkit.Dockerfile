# Pin multi-platform indexes so both amd64 and arm64 use verified toolchain images.
FROM golang:1.26.6-bookworm@sha256:116d58cbd88c1297624acc6e967a060012422bacf9930927e23fb719189c6f36 AS go-toolchain

# Security review (docker:S6471): run.sh needs root to create the requested host
# UID/GID and Docker socket group, then drops to PUSER with su. Do not replace
# that startup identity with a fixed USER that prevents bind-mount setup.
FROM node:24.22.1-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205

EXPOSE 9000 9443 8000
WORKDIR /src/portainer
ENV PATH="/usr/local/go/bin:${PATH}"

# Explicit dependencies only. Keep apt metadata out of the final image layer.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        build-essential \
        ca-certificates \
        curl \
        git \
        openssh-client \
        passwd \
    && rm -rf /var/lib/apt/lists/*

# Trust only Docker's pinned signing key, scoped to this repository. No remote
# setup scripts, apt-key global trust, or insecure redirect protocols.
RUN install -d -m 0755 /etc/apt/keyrings \
    && curl --proto '=https' --proto-redir '=https' --fail --silent --show-error --location \
        https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
    && echo '1500c1f56fa9e26b9b8f42452a553675796ade0807cdce11975eb98170b3a570  /etc/apt/keyrings/docker.asc' | sha256sum --check --strict \
    && chmod 0644 /etc/apt/keyrings/docker.asc \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# npm checks package integrity; pin the maintained package manager and do not
# execute package lifecycle scripts. Node and Go come from the pinned images.
RUN npm install --global --ignore-scripts --registry=https://registry.npmjs.org pnpm@10.26.2 \
    && npm cache clean --force
COPY --from=go-toolchain /usr/local/go /usr/local/go

# REVIEW: the Node base image ships a "node" user/group with UID/GID 1000, the
# usual host developer IDs. run.sh must create PUSER with the host PUID/PGID,
# so free those IDs as the previous ubuntu base did.
RUN userdel --remove node \
    && if getent group node >/dev/null; then groupdel node; fi

COPY --chmod=0755 run.sh /run.sh
ENTRYPOINT ["/run.sh"]
