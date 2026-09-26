# Release and deployment

## Registry transition policy

The beta release is `2.39.3.2.27-beta.3`; its [release notes](../releases/2.39.3.2.27-beta.3.md) describe the changes since the transitional `.26` WIP release. Keep the existing `themodcrafttmc/portainer` repository and its tags intact.

A dedicated Vessel HQ Docker Hub repository is planned but has not been created or selected yet. Future publishing must not switch registries, retag historical images, or change update discovery until that repository name and its migration plan are explicitly approved. Once approved, update the build script, release workflow, update checker, UI links, and this document together.

## Build and publish

The release source is `RELEASE_VERSION`. `scripts/build-release-context.sh` builds the frontend once and produces static Linux binaries for both AMD64 and ARM64 under `dist/release-context/`, with binary checksums in `SHA256SUMS`. Use Node 22.22.1, pnpm 10.26.2, and the Go version in `go.mod`.

The Linux image workflow uses the same release context and runs release-version checks, TypeScript, frontend lint/boundaries, frontend tests, backend tests, and execution checks for both images. Pushes to `develop` validate and build. Publishing runs only for a matching `v<RELEASE_VERSION>` tag or a manual dispatch; a supplied manual version must match the version file. The workflow refuses an existing published tag or a failed registry lookup, publishes the immutable version, verifies its digest and both platforms, then promotes that digest to the matching channel alias and checks the alias digest. Beta versions ending in `-beta.N` use `beta`; numeric stable versions use `latest`.

Commit the release changes before tagging or generating the final publication context so that the embedded Git revision identifies the released source. Never reuse an existing published version tag.

The generated `BUILD-IMAGE.txt` contains the exact commands for the release:

```sh
./scripts/build-release-context.sh
cd dist/release-context
docker buildx build --platform linux/amd64,linux/arm64 \
  -t themodcrafttmc/portainer:2.39.3.2.27-beta.3 --push .
docker buildx imagetools create \
  -t themodcrafttmc/portainer:beta \
  themodcrafttmc/portainer:2.39.3.2.27-beta.3
```

The immutable version is published and verified before the channel alias is moved. Both registry references must resolve to the same OCI index digest and contain `linux/amd64` and `linux/arm64` manifests.

## Node 4 deployment

Node 4 runs the AMD64 image as a standalone Docker container named `portainer`. Preserve these runtime settings during replacement:

- restart policy `always`;
- host ports 8000 and 9443;
- volume `portainer_data:/data`;
- bind `/var/run/docker.sock:/var/run/docker.sock`;
- bridge networking.

Credentials stay outside this repository. The service-account descriptor refers to a macOS Keychain entry; never copy the password into scripts, documentation, shell history, or environment files.

Before replacement, pull the immutable tag and verify its selected architecture and registry digest. Stop and rename the prior container to `portainer-rollback-<version>`, then start the new container with the same settings. Verify `https://127.0.0.1:9443/api/status`, the running image digest, restart policy, and startup logs.

## Rollback

If startup or the HTTPS check fails:

1. stop and remove only the failed new `portainer` container;
2. rename the retained rollback container to `portainer`;
3. start it and verify `/api/status`.

The named `portainer_data` volume is never removed during deployment or rollback.
