'use client';

import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/domains/edge/queries/edge-stacks/query-keys';
import {
  useLicenseOverused,
  useUntrustedCount,
} from '@/domains/edge/queries/waiting-room';
import { Datatable as WaitingRoomDatatable } from '@/domains/edge/views/edge-devices/WaitingRoomView/Datatable';
import { EdgeGroupsDatatable } from '@/domains/edge/views/edge-groups/ListView/EdgeGroupsDatatable';
import { EdgeJobsDatatable } from '@/domains/edge/views/edge-jobs/ListView/EdgeJobsDatatable';
import { EdgeStacksDatatable } from '@/domains/edge/views/edge-stacks/ListView/EdgeStacksDatatable';
import { Alert } from '@/ui/components/feedback/Alert';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { Link } from '@/ui/components/links/Link';
import { PageHeader } from '@/ui/layouts/view-layout';

import { InformationPanel } from '@@/InformationPanel';

export function EdgeGroupsContent() {
  return <EdgeGroupsDatatable />;
}

export function EdgeJobsContent() {
  return (
    <>
      <div className="row">
        <div className="col-sm-12">
          <InformationPanel title="Information">
            <p className="small text-muted">
              Edge Jobs requires Docker Standalone and a cron implementation
              that reads jobs from <code>/etc/cron.d</code>
            </p>
          </InformationPanel>
        </div>
      </div>
      <EdgeJobsDatatable />
    </>
  );
}

export function EdgeStacksHeader() {
  const queryClient = useQueryClient();
  return (
    <PageHeader
      title="Edge Stacks list"
      breadcrumbs="Edge Stacks"
      reload
      onReload={() => queryClient.invalidateQueries(queryKeys.base())}
    />
  );
}

export function EdgeStacksContent() {
  return <EdgeStacksDatatable />;
}

export function EdgeWaitingRoomContent() {
  const untrustedCount = useUntrustedCount();
  const licenseOverused = useLicenseOverused(untrustedCount);

  return (
    <>
      <div className="row">
        <div className="col-sm-12">
          <InformationPanel>
            <TextTip color="blue">
              Only environments generated from the{' '}
              <Link
                to="/environments/aeec"
                data-cy="waitingRoom-edgeAutoCreateScriptLink"
              >
                auto onboarding
              </Link>{' '}
              script will appear here, manually added environments and edge
              devices will bypass the waiting room.
            </TextTip>
          </InformationPanel>
        </div>
      </div>
      {licenseOverused && <LicenseLimitWarning />}
      <WaitingRoomDatatable />
    </>
  );
}

function LicenseLimitWarning() {
  return (
    <div className="row">
      <div className="col-sm-12">
        <Alert color="warn">
          Associating all nodes in waiting room will exceed the node limit of
          your current license. Go to{' '}
          <Link to="/licenses" data-cy="waitingRoom-portainerLicensesLink">
            Licenses
          </Link>{' '}
          page to view the current usage.
        </Alert>
      </div>
    </div>
  );
}
