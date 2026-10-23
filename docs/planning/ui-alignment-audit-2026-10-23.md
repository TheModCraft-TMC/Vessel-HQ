# UI alignment audit — October 23, 2026

Status: **incomplete**. The route inventory contains 168 page files; 22 route
patterns were visually inspected on the deployed 1.3.1 desktop UI. Inventory
coverage is not visual coverage. Resource detail routes require real resource
IDs, suitable environment capabilities and authorized read access.

## Confirmed findings and local fixes

| Finding | Local change | Verification scope |
| --- | --- | --- |
| Registry creation card extends one horizontal page inset beyond its heading and other administration cards. The edit form uses the same unwrapped composition. | Wrap create and edit widgets in the existing `PageContent` grid. | Create observed live; edit confirmed from composition. Composition checked locally; full authenticated patched route remains pending. |
| Fixed action bars use 300px/72px sidebar offsets, while the current console uses 280px/64px. The old offset also remains on phones where the sidebar overlays the page. | Inherit `--active-sidebar-width`; use a zero left inset at the shell's 720px mobile breakpoint and match its 200ms transition. Respect reduced motion. | Actual shared footer checked at desktop 1440px with 280px/64px offsets and at phone 320px/390px. Four actions wrap at 320px without overflow. |
| Shared table stylesheet targets a nonexistent `last-child` element instead of the last data cell. | Correct the selector to `td:last-child`, matching the header's existing 20px trailing padding. | Source selector corrected; shared datatable rendered locally at 320px with no document overflow. |
| Account and activity-log cards are inset twice within `PageContent`. | Flush nested datatables and remove redundant row/column wrappers; keep route-owned page spacing. | Account and activity logs observed live; production compilation and component checks apply to the patches. |
| Environment access and registry-summary tables bleed beyond card edges. | Use the existing `no-padding` WidgetBody contract, avoiding incompatible negative table margins. | Access observed live; registry summary confirmed by identical source composition. |
| Account theme controls render as unstyled, compressed icon options. | Colocated SegmentedControl CSS Module, accessible radiogroup, consistent sizes/states/focus styles. | Real shared story rendered at 390px; changing the radio selection updates checked state. |
| The current off-canvas navigation lacks a wired dismissal overlay/focus boundary. | Use the existing Radix modal primitive on phones: outside dismissal, close control, focus containment, Escape and route-selection dismissal. | Local 320px drawer: no horizontal overflow, Shift+Tab remains inside, Escape closes and restores the toggle. Component regressions cover desktop behavior and link dismissal. |
| Phone toolbars/actions crowd a single line. | Wrap datatable title, search and action groups; wrap footer groups and reserve up to 160px so forms are not hidden. | Shared datatable, four-action footer and long resource header checked at 320px without document overflow. |

These changes are local and have not been deployed. The live observations above
refer to the existing release, not the patched working tree. No forms were
submitted and no production resources were changed.

The final patch set passed all seven frontend checks: 368 test files and
2,505 tests, typecheck, architecture/App Router checks, lint with zero errors
and 194 existing warnings, and the production build. See the migration summary
for the independent adapter/harness results. Browser checks here use actual
project components and fixture data in local Storybook; they are not a claim of
production backend or every-route coverage.

## Browser limitations

The user's logged-in native Chrome enabled the desktop observations below.
Direct extension attachment later explicitly denied the Vessel origin through
a saved permission policy. No alternate browser, raw CDP, indirect script or
network route is used to bypass that denial. The user has been asked to change
the extension site permission. Local Storybook checks continue independently.
Docker Desktop was unavailable for the normal authenticated local backend.

## Open GitHub issues at audit start

- #241 requests a mobile view; shared navigation, toolbar and footer behavior
  is implemented locally, but the full deployed-page audit remains incomplete.
- #235–#240 are SonarCloud findings. Five intentional root cases are now Accepted in Sonar and closed on GitHub.
  #235 has an artifact-confinement source fix awaiting reanalysis; see the
  [remediation ledger](github-issue-remediation.md#october-23-follow-up).
- #243 (MCP Code Mode) and #244 (infrastructure-as-code evaluation) are feature
  proposals, separate from this alignment audit. No implementation is claimed.

## Route coverage

“Observed” records the desktop reference visit only. It does not assert that
all tabs, dialogs, scroll positions or responsive states of that page passed.
`/settings/[section]` includes the authentication and edge-compute variants;
resource identifiers and provider capabilities must be selected per route.

| Route pattern | Source | Live reference |
| --- | --- | --- |
| `/account/helm-repository/new` | [(console)/(account)/account/helm-repository/new/page.tsx](../../web-src/app/(console)/(account)/account/helm-repository/new/page.tsx) | Observed on deployed 1.3.1 |
| `/account` | [(console)/(account)/account/page.tsx](../../web-src/app/(console)/(account)/account/page.tsx) | Observed on deployed 1.3.1 |
| `/account/tokens/new` | [(console)/(account)/account/tokens/new/page.tsx](../../web-src/app/(console)/(account)/account/tokens/new/page.tsx) | Observed on deployed 1.3.1 |
| `/activity-logs` | [(console)/(administration)/activity-logs/page.tsx](../../web-src/app/(console)/(administration)/activity-logs/page.tsx) | Observed on deployed 1.3.1 |
| `/environments/[id]/access` | [(console)/(administration)/environments/[id]/access/page.tsx](../../web-src/app/(console)/(administration)/environments/[id]/access/page.tsx) | Observed on deployed 1.3.1 |
| `/environments/[id]` | [(console)/(administration)/environments/[id]/page.tsx](../../web-src/app/(console)/(administration)/environments/[id]/page.tsx) | Observed on deployed 1.3.1 |
| `/environments/aeec` | [(console)/(administration)/environments/aeec/page.tsx](../../web-src/app/(console)/(administration)/environments/aeec/page.tsx) | Pending live inspection |
| `/environments/new` | [(console)/(administration)/environments/new/page.tsx](../../web-src/app/(console)/(administration)/environments/new/page.tsx) | Observed on deployed 1.3.1 |
| `/environments` | [(console)/(administration)/environments/page.tsx](../../web-src/app/(console)/(administration)/environments/page.tsx) | Observed on deployed 1.3.1 |
| `/extensions/[extensionId]` | [(console)/(administration)/extensions/[extensionId]/page.tsx](../../web-src/app/(console)/(administration)/extensions/[extensionId]/page.tsx) | Pending live inspection |
| `/extensions` | [(console)/(administration)/extensions/page.tsx](../../web-src/app/(console)/(administration)/extensions/page.tsx) | Deployed 1.3.1 returns 404; source route exists |
| `/groups/[id]` | [(console)/(administration)/groups/[id]/page.tsx](../../web-src/app/(console)/(administration)/groups/[id]/page.tsx) | Pending live inspection |
| `/groups/new` | [(console)/(administration)/groups/new/page.tsx](../../web-src/app/(console)/(administration)/groups/new/page.tsx) | Observed on deployed 1.3.1 |
| `/groups` | [(console)/(administration)/groups/page.tsx](../../web-src/app/(console)/(administration)/groups/page.tsx) | Pending live inspection |
| `/licenses` | [(console)/(administration)/licenses/page.tsx](../../web-src/app/(console)/(administration)/licenses/page.tsx) | Pending live inspection |
| `/notifications` | [(console)/(administration)/notifications/page.tsx](../../web-src/app/(console)/(administration)/notifications/page.tsx) | Observed on deployed 1.3.1 |
| `/registries/[id]` | [(console)/(administration)/registries/[id]/page.tsx](../../web-src/app/(console)/(administration)/registries/[id]/page.tsx) | Pending live inspection |
| `/registries/[id]/repositories` | [(console)/(administration)/registries/[id]/repositories/page.tsx](../../web-src/app/(console)/(administration)/registries/[id]/repositories/page.tsx) | Pending live inspection |
| `/registries/[id]/repository` | [(console)/(administration)/registries/[id]/repository/page.tsx](../../web-src/app/(console)/(administration)/registries/[id]/repository/page.tsx) | Pending live inspection |
| `/registries/new` | [(console)/(administration)/registries/new/page.tsx](../../web-src/app/(console)/(administration)/registries/new/page.tsx) | Observed on deployed 1.3.1 |
| `/registries` | [(console)/(administration)/registries/page.tsx](../../web-src/app/(console)/(administration)/registries/page.tsx) | Pending live inspection |
| `/roles` | [(console)/(administration)/roles/page.tsx](../../web-src/app/(console)/(administration)/roles/page.tsx) | Observed on deployed 1.3.1 |
| `/settings/[section]` | [(console)/(administration)/settings/[section]/page.tsx](../../web-src/app/(console)/(administration)/settings/[section]/page.tsx) | Pending live inspection |
| `/settings` | [(console)/(administration)/settings/page.tsx](../../web-src/app/(console)/(administration)/settings/page.tsx) | Observed on deployed 1.3.1 |
| `/settings/shared-credentials` | [(console)/(administration)/settings/shared-credentials/page.tsx](../../web-src/app/(console)/(administration)/settings/shared-credentials/page.tsx) | Pending live inspection |
| `/tags` | [(console)/(administration)/tags/page.tsx](../../web-src/app/(console)/(administration)/tags/page.tsx) | Observed on deployed 1.3.1 |
| `/teams/[id]` | [(console)/(administration)/teams/[id]/page.tsx](../../web-src/app/(console)/(administration)/teams/[id]/page.tsx) | Pending live inspection |
| `/teams` | [(console)/(administration)/teams/page.tsx](../../web-src/app/(console)/(administration)/teams/page.tsx) | Observed on deployed 1.3.1 |
| `/update-schedules/[id]` | [(console)/(administration)/update-schedules/[id]/page.tsx](../../web-src/app/(console)/(administration)/update-schedules/[id]/page.tsx) | Pending live inspection |
| `/update-schedules/new` | [(console)/(administration)/update-schedules/new/page.tsx](../../web-src/app/(console)/(administration)/update-schedules/new/page.tsx) | Pending live inspection |
| `/update-schedules` | [(console)/(administration)/update-schedules/page.tsx](../../web-src/app/(console)/(administration)/update-schedules/page.tsx) | Pending live inspection |
| `/users/[id]` | [(console)/(administration)/users/[id]/page.tsx](../../web-src/app/(console)/(administration)/users/[id]/page.tsx) | Pending live inspection |
| `/users` | [(console)/(administration)/users/page.tsx](../../web-src/app/(console)/(administration)/users/page.tsx) | Observed on deployed 1.3.1 |
| `/sources/[sourceId]` | [(console)/(app-delivery)/sources/[sourceId]/page.tsx](../../web-src/app/(console)/(app-delivery)/sources/[sourceId]/page.tsx) | Pending live inspection |
| `/sources/new` | [(console)/(app-delivery)/sources/new/page.tsx](../../web-src/app/(console)/(app-delivery)/sources/new/page.tsx) | Observed on deployed 1.3.1 |
| `/sources` | [(console)/(app-delivery)/sources/page.tsx](../../web-src/app/(console)/(app-delivery)/sources/page.tsx) | Pending live inspection |
| `/workflows/[workflowId]` | [(console)/(app-delivery)/workflows/[workflowId]/page.tsx](../../web-src/app/(console)/(app-delivery)/workflows/[workflowId]/page.tsx) | Pending live inspection |
| `/workflows` | [(console)/(app-delivery)/workflows/page.tsx](../../web-src/app/(console)/(app-delivery)/workflows/page.tsx) | Pending live inspection |
| `/edge/devices/waiting-room` | [(console)/(edge)/edge/devices/waiting-room/page.tsx](../../web-src/app/(console)/(edge)/edge/devices/waiting-room/page.tsx) | Pending live inspection |
| `/edge/groups/[groupId]` | [(console)/(edge)/edge/groups/[groupId]/page.tsx](../../web-src/app/(console)/(edge)/edge/groups/[groupId]/page.tsx) | Pending live inspection |
| `/edge/groups/new` | [(console)/(edge)/edge/groups/new/page.tsx](../../web-src/app/(console)/(edge)/edge/groups/new/page.tsx) | Pending live inspection |
| `/edge/groups` | [(console)/(edge)/edge/groups/page.tsx](../../web-src/app/(console)/(edge)/edge/groups/page.tsx) | Pending live inspection |
| `/edge/jobs/[id]` | [(console)/(edge)/edge/jobs/[id]/page.tsx](../../web-src/app/(console)/(edge)/edge/jobs/[id]/page.tsx) | Pending live inspection |
| `/edge/jobs/new` | [(console)/(edge)/edge/jobs/new/page.tsx](../../web-src/app/(console)/(edge)/edge/jobs/new/page.tsx) | Pending live inspection |
| `/edge/jobs` | [(console)/(edge)/edge/jobs/page.tsx](../../web-src/app/(console)/(edge)/edge/jobs/page.tsx) | Pending live inspection |
| `/edge/stacks/[stackId]` | [(console)/(edge)/edge/stacks/[stackId]/page.tsx](../../web-src/app/(console)/(edge)/edge/stacks/[stackId]/page.tsx) | Pending live inspection |
| `/edge/stacks/new` | [(console)/(edge)/edge/stacks/new/page.tsx](../../web-src/app/(console)/(edge)/edge/stacks/new/page.tsx) | Pending live inspection |
| `/edge/stacks` | [(console)/(edge)/edge/stacks/page.tsx](../../web-src/app/(console)/(edge)/edge/stacks/page.tsx) | Pending live inspection |
| `/edge/templates/custom/[id]` | [(console)/(edge)/edge/templates/custom/[id]/page.tsx](../../web-src/app/(console)/(edge)/edge/templates/custom/[id]/page.tsx) | Pending live inspection |
| `/edge/templates/custom/new` | [(console)/(edge)/edge/templates/custom/new/page.tsx](../../web-src/app/(console)/(edge)/edge/templates/custom/new/page.tsx) | Pending live inspection |
| `/edge/templates/custom` | [(console)/(edge)/edge/templates/custom/page.tsx](../../web-src/app/(console)/(edge)/edge/templates/custom/page.tsx) | Pending live inspection |
| `/edge/templates` | [(console)/(edge)/edge/templates/page.tsx](../../web-src/app/(console)/(edge)/edge/templates/page.tsx) | Pending live inspection |
| `/[endpointId]/azure/containerinstances` | [(console)/(environment)/[endpointId]/azure/containerinstances/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/azure/containerinstances/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/azure/containerinstances/[id]` | [(console)/(environment)/[endpointId]/azure/containerinstances/[id]/(details)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/azure/containerinstances/[id]/(details)/page.tsx) | Pending live inspection |
| `/[endpointId]/azure/containerinstances/new` | [(console)/(environment)/[endpointId]/azure/containerinstances/new/(create)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/azure/containerinstances/new/(create)/page.tsx) | Pending live inspection |
| `/[endpointId]/azure/dashboard` | [(console)/(environment)/[endpointId]/azure/dashboard/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/azure/dashboard/page.tsx) | Pending live inspection |
| `/[endpointId]/azure` | [(console)/(environment)/[endpointId]/azure/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/azure/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/configs` | [(console)/(environment)/[endpointId]/docker/configs/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/configs/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/configs/[id]` | [(console)/(environment)/[endpointId]/docker/configs/[id]/(details)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/configs/[id]/(details)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/configs/new` | [(console)/(environment)/[endpointId]/docker/configs/new/(create)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/configs/new/(create)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/containers` | [(console)/(environment)/[endpointId]/docker/containers/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/containers/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/containers/[id]` | [(console)/(environment)/[endpointId]/docker/containers/[id]/(details)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/containers/[id]/(details)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/containers/[id]/attach` | [(console)/(environment)/[endpointId]/docker/containers/[id]/attach/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/containers/[id]/attach/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/containers/[id]/exec` | [(console)/(environment)/[endpointId]/docker/containers/[id]/exec/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/containers/[id]/exec/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/containers/[id]/inspect` | [(console)/(environment)/[endpointId]/docker/containers/[id]/inspect/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/containers/[id]/inspect/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/containers/[id]/logs` | [(console)/(environment)/[endpointId]/docker/containers/[id]/logs/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/containers/[id]/logs/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/containers/[id]/stats` | [(console)/(environment)/[endpointId]/docker/containers/[id]/stats/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/containers/[id]/stats/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/containers/new` | [(console)/(environment)/[endpointId]/docker/containers/new/(create)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/containers/new/(create)/page.tsx) | Observed on deployed 1.3.1 |
| `/[endpointId]/docker/dashboard` | [(console)/(environment)/[endpointId]/docker/dashboard/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/dashboard/page.tsx) | Observed on deployed 1.3.1 |
| `/[endpointId]/docker/events` | [(console)/(environment)/[endpointId]/docker/events/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/events/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/host` | [(console)/(environment)/[endpointId]/docker/host/(overview)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/host/(overview)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/host/browser` | [(console)/(environment)/[endpointId]/docker/host/browser/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/host/browser/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/host/feat-config` | [(console)/(environment)/[endpointId]/docker/host/feat-config/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/host/feat-config/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/host/registries` | [(console)/(environment)/[endpointId]/docker/host/registries/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/host/registries/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/host/registries/[id]/access` | [(console)/(environment)/[endpointId]/docker/host/registries/[id]/access/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/host/registries/[id]/access/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/images` | [(console)/(environment)/[endpointId]/docker/images/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/images/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/images/[id]` | [(console)/(environment)/[endpointId]/docker/images/[id]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/images/[id]/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/images/build` | [(console)/(environment)/[endpointId]/docker/images/build/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/images/build/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/images/import` | [(console)/(environment)/[endpointId]/docker/images/import/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/images/import/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/networks` | [(console)/(environment)/[endpointId]/docker/networks/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/networks/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/networks/[id]` | [(console)/(environment)/[endpointId]/docker/networks/[id]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/networks/[id]/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/networks/new` | [(console)/(environment)/[endpointId]/docker/networks/new/(create)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/networks/new/(create)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/nodes/[id]` | [(console)/(environment)/[endpointId]/docker/nodes/[id]/(details)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/nodes/[id]/(details)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/nodes/[id]/browse` | [(console)/(environment)/[endpointId]/docker/nodes/[id]/browse/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/nodes/[id]/browse/page.tsx) | Pending live inspection |
| `/[endpointId]/docker` | [(console)/(environment)/[endpointId]/docker/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/secrets` | [(console)/(environment)/[endpointId]/docker/secrets/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/secrets/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/secrets/[id]` | [(console)/(environment)/[endpointId]/docker/secrets/[id]/(details)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/secrets/[id]/(details)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/secrets/new` | [(console)/(environment)/[endpointId]/docker/secrets/new/(create)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/secrets/new/(create)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/services` | [(console)/(environment)/[endpointId]/docker/services/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/services/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/services/[id]` | [(console)/(environment)/[endpointId]/docker/services/[id]/(details)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/services/[id]/(details)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/services/[id]/logs` | [(console)/(environment)/[endpointId]/docker/services/[id]/logs/(view)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/services/[id]/logs/(view)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/services/new` | [(console)/(environment)/[endpointId]/docker/services/new/(create)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/services/new/(create)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/stacks` | [(console)/(environment)/[endpointId]/docker/stacks/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/stacks/(list)/page.tsx) | DOM observed on deployed 1.3.1; screenshot pending |
| `/[endpointId]/docker/stacks/[name]` | [(console)/(environment)/[endpointId]/docker/stacks/[name]/(details)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/stacks/[name]/(details)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/stacks/[name]/[id]` | [(console)/(environment)/[endpointId]/docker/stacks/[name]/[id]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/stacks/[name]/[id]/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/stacks/newstack` | [(console)/(environment)/[endpointId]/docker/stacks/newstack/(create)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/stacks/newstack/(create)/page.tsx) | Observed on deployed 1.3.1 |
| `/[endpointId]/docker/swarm` | [(console)/(environment)/[endpointId]/docker/swarm/(overview)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/swarm/(overview)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/swarm/feat-config` | [(console)/(environment)/[endpointId]/docker/swarm/feat-config/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/swarm/feat-config/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/swarm/registries` | [(console)/(environment)/[endpointId]/docker/swarm/registries/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/swarm/registries/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/swarm/registries/[id]/access` | [(console)/(environment)/[endpointId]/docker/swarm/registries/[id]/access/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/swarm/registries/[id]/access/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/swarm/visualizer` | [(console)/(environment)/[endpointId]/docker/swarm/visualizer/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/swarm/visualizer/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/tasks/[id]` | [(console)/(environment)/[endpointId]/docker/tasks/[id]/(details)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/tasks/[id]/(details)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/tasks/[id]/logs` | [(console)/(environment)/[endpointId]/docker/tasks/[id]/logs/(view)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/tasks/[id]/logs/(view)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/templates` | [(console)/(environment)/[endpointId]/docker/templates/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/templates/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/templates/custom` | [(console)/(environment)/[endpointId]/docker/templates/custom/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/templates/custom/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/templates/custom/[id]` | [(console)/(environment)/[endpointId]/docker/templates/custom/[id]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/templates/custom/[id]/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/templates/custom/new` | [(console)/(environment)/[endpointId]/docker/templates/custom/new/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/templates/custom/new/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/volumes` | [(console)/(environment)/[endpointId]/docker/volumes/(list)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/volumes/(list)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/volumes/[id]` | [(console)/(environment)/[endpointId]/docker/volumes/[id]/(details)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/volumes/[id]/(details)/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/volumes/[id]/browse` | [(console)/(environment)/[endpointId]/docker/volumes/[id]/browse/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/volumes/[id]/browse/page.tsx) | Pending live inspection |
| `/[endpointId]/docker/volumes/new` | [(console)/(environment)/[endpointId]/docker/volumes/new/(create)/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/docker/volumes/new/(create)/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/applications/[namespace]/[name]/[pod]/[container]/console` | [(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/[pod]/[container]/console/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/[pod]/[container]/console/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/applications/[namespace]/[name]/[pod]/[container]/logs` | [(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/[pod]/[container]/logs/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/[pod]/[container]/logs/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/applications/[namespace]/[name]/[pod]/[container]/stats` | [(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/[pod]/[container]/stats/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/[pod]/[container]/stats/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/applications/[namespace]/[name]/edit` | [(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/edit/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/edit/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/applications/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/applications/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/applications/new` | [(console)/(environment)/[endpointId]/kubernetes/applications/new/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/applications/new/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/applications` | [(console)/(environment)/[endpointId]/kubernetes/applications/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/applications/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/cluster/[nodeName]` | [(console)/(environment)/[endpointId]/kubernetes/cluster/[nodeName]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/cluster/[nodeName]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/cluster/[nodeName]/stats` | [(console)/(environment)/[endpointId]/kubernetes/cluster/[nodeName]/stats/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/cluster/[nodeName]/stats/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/cluster/configure` | [(console)/(environment)/[endpointId]/kubernetes/cluster/configure/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/cluster/configure/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/cluster` | [(console)/(environment)/[endpointId]/kubernetes/cluster/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/cluster/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/configmaps/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/configmaps/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/configmaps/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/configmaps/new` | [(console)/(environment)/[endpointId]/kubernetes/configmaps/new/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/configmaps/new/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/configurations` | [(console)/(environment)/[endpointId]/kubernetes/configurations/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/configurations/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/dashboard` | [(console)/(environment)/[endpointId]/kubernetes/dashboard/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/dashboard/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/deploy` | [(console)/(environment)/[endpointId]/kubernetes/deploy/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/deploy/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/helm/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/helm/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/helm/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/helm` | [(console)/(environment)/[endpointId]/kubernetes/helm/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/helm/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/ingresses/[namespace]/[name]/edit` | [(console)/(environment)/[endpointId]/kubernetes/ingresses/[namespace]/[name]/edit/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/ingresses/[namespace]/[name]/edit/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/ingresses/add` | [(console)/(environment)/[endpointId]/kubernetes/ingresses/add/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/ingresses/add/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/ingresses` | [(console)/(environment)/[endpointId]/kubernetes/ingresses/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/ingresses/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/kubectl-shell` | [(console)/(environment)/[endpointId]/kubernetes/kubectl-shell/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/kubectl-shell/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/clusterRoleBindings/[name]` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/clusterRoleBindings/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/clusterRoleBindings/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/clusterRoles/[name]` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/clusterRoles/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/clusterRoles/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/clusterRoles` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/clusterRoles/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/clusterRoles/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/cronjobs/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/cronjobs/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/cronjobs/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/jobs/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/jobs/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/jobs/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/jobs` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/jobs/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/jobs/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/roleBindings/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/roleBindings/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/roleBindings/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/roles/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/roles/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/roles/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/roles` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/roles/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/roles/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/serviceAccounts/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/serviceAccounts/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/serviceAccounts/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/moreResources/serviceAccounts` | [(console)/(environment)/[endpointId]/kubernetes/moreResources/serviceAccounts/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/moreResources/serviceAccounts/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/namespaces/[id]/access` | [(console)/(environment)/[endpointId]/kubernetes/namespaces/[id]/access/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/namespaces/[id]/access/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/namespaces/[id]` | [(console)/(environment)/[endpointId]/kubernetes/namespaces/[id]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/namespaces/[id]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/namespaces/new` | [(console)/(environment)/[endpointId]/kubernetes/namespaces/new/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/namespaces/new/page.tsx) | Observed on deployed 1.3.1 |
| `/[endpointId]/kubernetes/namespaces` | [(console)/(environment)/[endpointId]/kubernetes/namespaces/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/namespaces/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes` | [(console)/(environment)/[endpointId]/kubernetes/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/registries/[id]/access` | [(console)/(environment)/[endpointId]/kubernetes/registries/[id]/access/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/registries/[id]/access/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/registries` | [(console)/(environment)/[endpointId]/kubernetes/registries/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/registries/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/secrets/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/secrets/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/secrets/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/secrets/new` | [(console)/(environment)/[endpointId]/kubernetes/secrets/new/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/secrets/new/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/services/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/services/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/services/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/services` | [(console)/(environment)/[endpointId]/kubernetes/services/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/services/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/stacks/[namespace]/[name]/logs` | [(console)/(environment)/[endpointId]/kubernetes/stacks/[namespace]/[name]/logs/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/stacks/[namespace]/[name]/logs/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/templates/custom/[id]` | [(console)/(environment)/[endpointId]/kubernetes/templates/custom/[id]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/templates/custom/[id]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/templates/custom/new` | [(console)/(environment)/[endpointId]/kubernetes/templates/custom/new/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/templates/custom/new/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/templates/custom` | [(console)/(environment)/[endpointId]/kubernetes/templates/custom/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/templates/custom/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/volumes/[namespace]/[name]` | [(console)/(environment)/[endpointId]/kubernetes/volumes/[namespace]/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/volumes/[namespace]/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/volumes` | [(console)/(environment)/[endpointId]/kubernetes/volumes/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/volumes/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/volumes/persistent-volumes/[name]` | [(console)/(environment)/[endpointId]/kubernetes/volumes/persistent-volumes/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/volumes/persistent-volumes/[name]/page.tsx) | Pending live inspection |
| `/[endpointId]/kubernetes/volumes/storage-classes/[name]` | [(console)/(environment)/[endpointId]/kubernetes/volumes/storage-classes/[name]/page.tsx](../../web-src/app/(console)/(environment)/[endpointId]/kubernetes/volumes/storage-classes/[name]/page.tsx) | Pending live inspection |
| `/` | [(console)/page.tsx](../../web-src/app/(console)/page.tsx) | Observed on deployed 1.3.1 |
| `/init/admin` | [init/admin/page.tsx](../../web-src/app/init/admin/page.tsx) | Pending live inspection |
| `/init/edge` | [init/edge/page.tsx](../../web-src/app/init/edge/page.tsx) | Pending live inspection |
| `/login` | [login/page.tsx](../../web-src/app/login/page.tsx) | Pending live inspection |
| `/logout` | [logout/page.tsx](../../web-src/app/logout/page.tsx) | Pending live inspection |
