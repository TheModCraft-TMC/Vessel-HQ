# Stack GitOps

Argo CD-inspired Docker stack delivery view: source/ref/path cards, recorded
source/deployment commit alignment, deployment state, live workload metadata,
and a confirmed **Sync from Git** action. It uses Vessel's existing Git clone,
Vault/environment resolution, authorization and Compose/Swarm deployment paths.
A deployment response means accepted; refresh to follow its outcome.

This package needs host support for `stacks.delivery.read` and
`stacks.gitops.sync`, plus scoped network reads. Its development manifest targets
environment 1 / stack 1. Adapt and review these scopes before uploading.
Only current administrators can use delivery operations; every request binds
registration revision, package digest, environment, stack and the reviewed stack
and source configuration hash. No Compose text, credentials or environment
values enter the extension API.

This is a stack-scoped delivery console, not complete Argo CD parity: runtime
configuration diff, revision history/rollback, multi-stack application creation,
webhook provisioning and independent reconciliation are future work. Existing
Vessel source scheduling continues to own Git synchronization. Recorded commit
alignment is not proof of runtime drift or application health.

Pack and isolated-build through [the builder](../../../scripts/native-extensions/README.md).
Upload, grants and compiled selection are separate steps; no backend executable
or external service is installed by this package.
