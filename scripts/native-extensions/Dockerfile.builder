# Build this separately reviewed toolchain image before accepting extension code.
# NODE_IMAGE must be a vetted Node 24.21+ image pinned with @sha256:... .
ARG NODE_IMAGE=node:24.21.0-bookworm@sha256:3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0
FROM ${NODE_IMAGE}
USER root
ENV COREPACK_HOME=/opt/vessel/corepack
RUN apt-get update && apt-get install -y --no-install-recommends git ripgrep && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.26.2 --activate && chmod -R a+rX /opt/vessel/corepack
WORKDIR /opt/vessel
# Context contains only reviewed root dependency inputs, never extension sources.
# Install Linux-native packages in Linux; Darwin node_modules cannot be reused.
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --ignore-scripts && pnpm rebuild @swc/core esbuild unrs-resolver
COPY lock.sha256 validate.mjs ./
RUN mkdir -p /opt/vessel/node_modules/.cache /opt/vessel/node_modules/.vite /opt/vessel/node_modules/.vite-temp && chmod 1777 /opt/vessel/node_modules/.cache /opt/vessel/node_modules/.vite /opt/vessel/node_modules/.vite-temp
WORKDIR /workspace
