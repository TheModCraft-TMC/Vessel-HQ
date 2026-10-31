# IaC integration evaluation — issue #244

Evaluated October 23, 2026. This document answers
[#244](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/244); provisioning is
future work, not an implemented or enabled capability.

## Recommendation

Add an optional infrastructure project workflow, starting with OpenTofu and a
runner contract that can later accommodate Pulumi. This complements Vessel's
Docker, Swarm, Podman, Kubernetes and Azure ACI operations: infrastructure code
can provision environments and supporting networks, volumes or DNS, while
Vessel continues operating enrolled environments. Do not turn the Go API or
Next server into a shell/provisioner host, and do not ship provider binaries in
the main Vessel image.

| Criterion | OpenTofu | Pulumi |
| --- | --- | --- |
| Authoring | Declarative HCL and reusable modules; natural Git plan/review workflow | General-purpose languages including TypeScript, Python and Go |
| Embedding | Bounded CLI jobs producing machine-readable plans/events | Automation API provides strongly typed orchestration; still requires the Pulumi CLI at runtime |
| Existing workflows | Best first option for users bringing Terraform-style projects; validate actual provider and state compatibility per project | Better when an application already owns Pulumi programs or needs language-level abstractions |
| State | Backend-specific locking and configurable state/plan encryption | Pulumi Cloud or a DIY backend; choose storage, access and backup explicitly |
| Operational cost | Engine, provider cache and state backend; provider credentials and maintenance remain required | Engine, language toolchain, dependency/provider cache and backend; optional hosted features may add costs |
| Vessel fit | First implementation candidate | Second engine behind the same job/approval interface |

This preference is a Vessel product/maintenance judgment, not a claim that one
engine provisions every provider more safely or cheaply. Actual provider
availability, supported versions, licenses and backend capabilities must be
checked for the chosen pilot. No paid service or new provider account is needed
to complete this evaluation.

## Product workflow

1. An authorized administrator connects a Git repository and chooses an engine,
   pinned revision, working directory, variable definitions and credential
   references. Secrets stay in Vault or the existing credential system.
2. A disposable worker checks out the exact revision, verifies pinned engine and
   provider/module dependencies, and creates a plan/preview with bounded time,
   CPU, memory, disk and network access. IaC plugins and language code are
   executable code; the agent's small JavaScript VM is not their isolation layer.
3. Vessel shows a structured change summary, destructive actions, engine/provider
   versions and sanitized logs. Store the plan digest, configuration digest and
   source commit. Treat plan/state artifacts as sensitive, including values
   labelled sensitive in the source language.
4. A user with apply permission approves that exact plan and target. Approval
   expires and is invalidated by source/configuration/credential-scope changes.
   Use one writer per project/backend stack, plus the backend's own state lock.
5. The runner applies the approved artifact where supported. Failed/unknown
   outcomes require refresh/reconciliation before another apply; never blindly
   retry a write. Destroy has separate explicit approval and authorization.
6. Publish progress through authenticated bounded realtime events and persist
   audit records. Environment enrollment is an explicit post-apply step using
   approved output fields, not arbitrary state exposure or a provider API proxy.

## Ownership and boundaries

- `web-src/app/`: infrastructure project routes and layouts.
- A new domain public API owns project workflows, plan review and approval UI.
- A provider adapter owns engine-specific DTOs/events behind domain mappers.
- `backend-src/`: project authorization, job scheduling, approvals, audit,
  credential references and a narrow runner protocol.
- Dedicated runner processes/containers own execution. No host Docker socket,
  arbitrary host paths or unrestricted cloud credentials are inherited.
- State belongs to a dedicated backend scoped by tenant/project/stack. It must
  not share Vessel's application database or be exposed by generic MCP discovery.
- Existing GitOps and IaC must never reconcile the same resource independently.
  Record ownership; require an explicit import/handoff before changing managers.
- Code Mode may discover and summarize plans. Applying infrastructure remains a
  protected host operation subject to the same user authorization and exact-plan
  approval, never authority granted by generated code or tool descriptions.

## Pilot and release gates

Start with one disposable test environment and a small existing OpenTofu
project. Implement plan/preview before apply. Accept a first release only after
cross-user/tenant denial tests, stale-plan rejection, duplicate-job locking,
credential revocation, cancellation, worker crash/restart, partial-apply
reconciliation, state backup/restore and secret/log redaction are demonstrated.
Keep an explicit resource inventory and test cleanup. Add Pulumi only after the
same runner contract and failure semantics work with a representative program.

No implementation duration or hosted-service cost is estimated without a real
pilot project and concurrency/retention requirements. The largest ongoing costs
are runner isolation, credentials, state recovery and engine/provider upgrades.

## Primary sources

- [OpenTofu workflow and providers](https://opentofu.org/docs/intro/).
- [OpenTofu state locking](https://opentofu.org/docs/language/state/locking/): locking depends on the selected backend.
- [OpenTofu state and plan encryption](https://opentofu.org/docs/language/state/encryption/): encryption does not prevent replay or hide data from the runner.
- [Pulumi Automation API](https://www.pulumi.com/docs/iac/concepts/automation-api/): programmatic integration still requires the CLI at runtime.
- [Pulumi state and backends](https://www.pulumi.com/docs/iac/concepts/state-and-backends/).
