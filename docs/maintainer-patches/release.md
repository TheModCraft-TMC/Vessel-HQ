# Release process

The release version is stored in `RELEASE_VERSION`. The build script produces a disposable, self-contained context in `dist/release-context`.

```sh
./scripts/build-release-context.sh
cd dist/release-context
docker buildx build --platform linux/amd64,linux/arm64 \
  -t themodcrafttmc/portainer:2.39.3.2.27-beta.1 --push .
```

The script installs the locked frontend dependencies, builds the production UI once, builds static Linux backends for both AMD64 and ARM64 with the release version embedded, and copies only the runtime artifacts plus a small multi-architecture Dockerfile into the context. The generated build command publishes an immutable manifest containing both platforms.

Push the immutable version first and the matching channel alias second (`beta` for this release):

```sh
docker buildx imagetools create \
  -t themodcrafttmc/portainer:beta \
  themodcrafttmc/portainer:2.39.3.2.27-beta.1
```

Publish the immutable version before moving the channel alias. Verify that both registry tags resolve to the same manifest digest and contain `linux/amd64` plus `linux/arm64`. Increment `RELEASE_VERSION` for every release; never reuse a published version tag.

The [Linux image workflow](../../.github/workflows/build-linux-image.yml) reads the version file rather than a hard-coded fallback. It rejects mismatched Git tags, manual versions, and already-published tags, runs the release checks, and publishes only on release tags or manual dispatch. `develop` pushes validate without publishing. Both the workflow and local builds use the same release-context Dockerfile; Storybook is not part of the server image.

See the [2.39.3.2.27-beta.1 release notes](../releases/2.39.3.2.27-beta.1.md) for the prepared changes and verification record.
