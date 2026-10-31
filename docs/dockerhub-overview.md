<p align="center">
  <img src="https://raw.githubusercontent.com/TheModCraft-TMC/Vessel-HQ/develop/web-src/public/images/vessel-hq-logo-dark.svg" alt="Vessel HQ" width="440" />
</p>

<p align="center">
  <a href="https://github.com/TheModCraft-TMC/Vessel-HQ/releases/latest"><img src="https://img.shields.io/github/v/release/TheModCraft-TMC/Vessel-HQ?color=44cc11&amp;style=for-the-badge" alt="Vessel HQ release" /></a>
  <a href="https://github.com/portainer/portainer"><img src="https://img.shields.io/badge/Portainer-CE%20fork-13b8a6?style=for-the-badge" alt="Portainer CE fork" /></a>
  <img src="https://img.shields.io/badge/bundler-Turbopack-blue?style=for-the-badge" alt="Development bundler: Turbopack" />
  <img src="https://img.shields.io/badge/migration-GPT--5.6%20Sol-10a37f?style=for-the-badge" alt="Migration built using GPT-5.6 Sol only" />
</p>

---

![Vessel HQ Docker overview](https://raw.githubusercontent.com/TheModCraft-TMC/Vessel-HQ/develop/docs/assets/docker-overview.jpg)

**Vessel HQ** is TheModCraft's independently maintained fork of Portainer Community Edition: a container management console for Docker, Docker Swarm, Podman, Kubernetes, and Azure Container Instances, with a homelab-first product direction.

---

## Key Features

* **Modern Console UI:** Built with Next.js and React, replacing legacy web interfaces.
* **Core Integrations:** Native support for GitOps pipelines, HashiCorp Vault, granular access controls, custom container registries, and real-time operational auditing.
* **Architecture:** Combines Portainer's Go backend with a modern front-end stack using Turbopack for local development and Webpack for production builds.

---

## Quick Start

Run Vessel HQ directly with Docker:

```bash
docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  --name vessel-hq \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v vessel_hq_data:/data \
  themodcrafttmc/vessel-hq:1.3.2
```

Open `https://YOUR_HOST:9443` and complete the initial administrator setup.

## Image tags

| Tag | Channel |
| --- | --- |
| `themodcrafttmc/vessel-hq:1.3.2` | Immutable stable release |
| `themodcrafttmc/vessel-hq:latest` | Current stable release |
| `themodcrafttmc/vessel-hq:beta` | Experimental preview channel |

Images support **linux/amd64** and **linux/arm64**. Vessel release versions are separate from the Portainer `2.45.0` API/datastore compatibility baseline.

## Upgrades and persistence

Keep the existing `/data` volume, Docker socket, ports, environment and network settings when recreating an existing deployment. Back up the datastore and retain the previous container for rollback. Pulling a new image does not replace a running container.

See the [release and deployment guide](https://github.com/TheModCraft-TMC/Vessel-HQ/blob/develop/docs/themodcraft/release-and-deployment.md) for upgrade and rollback steps.

## Source, documentation and support

- [Source and README](https://github.com/TheModCraft-TMC/Vessel-HQ)
- [Releases](https://github.com/TheModCraft-TMC/Vessel-HQ/releases)
- [Feature catalog](https://github.com/TheModCraft-TMC/Vessel-HQ/blob/develop/docs/recent-features/README.md)
- [Report an issue](https://github.com/TheModCraft-TMC/Vessel-HQ/issues)
- [Security policy](https://github.com/TheModCraft-TMC/Vessel-HQ/security/policy)

Vessel HQ is a community-maintained fork. Experimental native extensions and proposed infrastructure provisioning are described in the project documentation; managed extension execution and infrastructure provisioning are future work.
