# Security policy

Vessel HQ is maintained by TheModCraft, independently of Portainer. The
upstream Portainer lifecycle and support commitments do not apply to this fork.

## Supported releases

Security fixes target the latest stable Vessel HQ release published in this
repository. Upgrade to that release before reporting a problem affecting an
older version where possible. Older stable releases do not have a guaranteed
backport window. Beta releases and development branches are experimental and
receive fixes on a best-effort basis. The upstream API compatibility version is
separate from the Vessel release version in `RELEASE_VERSION`.

## Private reporting

Use [GitHub private vulnerability reporting](https://github.com/TheModCraft-TMC/Vessel-HQ/security/advisories/new)
for this repository. Private vulnerability reporting was confirmed enabled on
October 29, 2026. The existing project contact is dev@themodcraft.net; prefer
GitHub's private channel for confidential reports. Do not include credentials,
production tokens or private infrastructure exports in a report.

Include the affected Vessel version, deployment platform, impact and a minimal
reproduction. Please report suspected vulnerabilities privately rather than in
public issues. Findings in upstream Portainer should also follow its
[security policy](https://github.com/portainer/portainer/security/policy).

TheModCraft maintainers triage reports, coordinate remediation and disclosure
with the reporter, and publish fixes and advisories in this repository. Response
and remediation dates depend on availability and severity; no response-time SLA,
paid bounty or legal safe-harbor commitment is offered by this policy. Reporter
credit is included with consent when a coordinated disclosure is published.

## Dependency findings

The [dependency inventory](backend-src/DEPENDENCY_SECURITY.md) records remaining
Go advisory ranges. The npm release checks retain the historical regression
snapshot and also query fresh advisories. Moderate, high and critical findings
block validation; low findings remain in the retained audit report and require
scoped remediation tracking. Failed or incomplete scans fail validation. A local
mitigation does not remove an affected version from upstream advisory databases.
