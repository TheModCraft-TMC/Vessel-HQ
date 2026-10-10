# Custom release versioning

This fork has two distinct version concepts and intentionally keeps them separate.

## Fork release version

`RELEASE_VERSION` is the authoritative Vessel HQ release identifier. The build script injects it into both `pkg/build.ReleaseVersion` and, by default, `pkg/build.ImageTag`; official releases use three-part semantic versions such as `1.2.0`.

The authenticated `GET /api/system/version` response exposes the maintained image tag as `ServerVersion`, falling back to the maintained fork release when required. Numeric stable releases and `-beta.N` prereleases are supported, including `2.39.3.2.27-beta.2`. It never uses the upstream API/schema version as the installed image version.

The sidebar footer and build-information dialog display this server version. They no longer display the upstream `2.45.0 LTS` string as the installed fork release.

## Update discovery

The backend checks the public tags for `themodcrafttmc/portainer` on Docker Hub instead of checking upstream Portainer GitHub releases. It:

1. fetches up to 100 recently updated tags every six hours;
2. ignores aliases (`latest`, `beta`) and prerelease tags when discovering stable updates;
3. keeps three-part Vessel HQ releases separate from historical five-part fork releases stored in the same repository;
4. compares every numeric component within the installed release's version family;
5. reports an update only when a newer maintained image tag exists.

The UI's update link opens the matching Docker Hub tag. Browser-side version data remains cached for 24 hours, with a hard browser refresh causing a new API request.

Beta builds display their full prerelease version. They can discover a stable
release with the same numeric version or a newer numeric version. Stable
clients are never offered beta images by this checker. Publishing promotes
beta builds to the `beta` Docker alias and numeric stable builds to `latest`.

## Upstream compatibility version

`portainer.APIVersion` and the database schema version remain upstream `2.45.0`. They are used for API compatibility, migrations, agents, and datastore safety; changing them to the fork release number would incorrectly trigger schema behavior.
