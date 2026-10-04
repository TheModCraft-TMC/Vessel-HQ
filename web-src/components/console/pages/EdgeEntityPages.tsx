'use client';

import { HardDriveIcon, LayersIcon, ListIcon, WrenchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useEdgeGroup } from '@/domains/edge/queries/edge-groups/useEdgeGroup';
import { useCreateEdgeGroupMutation } from '@/domains/edge/queries/edge-groups/useCreateEdgeGroupMutation';
import { useUpdateEdgeGroupMutation } from '@/domains/edge/queries/edge-groups/useUpdateEdgeGroupMutation';
import { useEdgeJob } from '@/domains/edge/queries/edge-jobs/useEdgeJob';
import { useEdgeStack } from '@/domains/edge/queries/edge-stacks/useEdgeStack';
import { EdgeGroupForm } from '@/domains/edge/views/edge-groups/components/EdgeGroupForm/EdgeGroupForm';
import { CreateEdgeJobForm } from '@/domains/edge/views/edge-jobs/CreateView/CreateEdgeJobForm';
import { ResultsDatatable } from '@/domains/edge/views/edge-jobs/ItemView/ResultsDatatable/ResultsDatatable';
import { UpdateEdgeJobForm } from '@/domains/edge/views/edge-jobs/ItemView/UpdateEdgeJobForm/UpdateEdgeJobForm';
import { CreateForm as CreateEdgeStackForm } from '@/domains/edge/views/edge-stacks/CreateView/CreateForm';
import { EditEdgeStackForm } from '@/domains/edge/views/edge-stacks/ItemView/EditEdgeStackForm/EditEdgeStackForm';
import { EnvironmentsDatatable as EdgeStackEnvironmentsDatatable } from '@/domains/edge/views/edge-stacks/ItemView/EnvironmentsDatatable';
import { Alert } from '@/ui/components/feedback/Alert';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

import { Widget } from '@@/Widget';
import { Tab, useCurrentTabIndex, WidgetTabs } from '@@/Widget/WidgetTabs';

export function EdgeGroupCreateContent() {
  const createGroup = useCreateEdgeGroupMutation();
  const router = useRouter();

  return (
    <EdgeFormContentLayout>
      <EdgeGroupForm
        onSubmit={({ environmentIds, ...values }) =>
          createGroup.mutate(
            { endpoints: environmentIds, ...values },
            {
              onSuccess: () => {
                notifySuccess('Success', 'Edge group successfully created');
                router.push('/edge/groups');
              },
            }
          )
        }
        isLoading={createGroup.isLoading}
      />
    </EdgeFormContentLayout>
  );
}

export function EdgeGroupDetailsHeader({ groupId }: { groupId: number }) {
  const groupQuery = useEdgeGroup(groupId);

  return (
    <PageHeader
      title="Edit edge group"
      breadcrumbs={[
        { label: 'Edge groups', link: '/edge/groups' },
        groupQuery.data?.Name || 'Edge group',
      ]}
    />
  );
}

export function EdgeGroupDetailsContent({ groupId }: { groupId: number }) {
  const groupQuery = useEdgeGroup(groupId);
  const updateGroup = useUpdateEdgeGroupMutation();
  const router = useRouter();
  if (!groupQuery.data) return null;

  return (
    <EdgeFormContentLayout>
      <EdgeGroupForm
        group={groupQuery.data}
        onSubmit={({ environmentIds, ...values }) =>
          updateGroup.mutate(
            { id: groupId, endpoints: environmentIds, ...values },
            {
              onSuccess: () => {
                notifySuccess('Success', 'Edge group successfully updated');
                router.push('/edge/groups');
              },
            }
          )
        }
        isLoading={updateGroup.isLoading}
      />
    </EdgeFormContentLayout>
  );
}

export function EdgeJobCreateContent() {
  return (
    <EdgeFormContentLayout>
      <CreateEdgeJobForm />
    </EdgeFormContentLayout>
  );
}

const JOB_TABS: Tab[] = [
  {
    name: 'Configuration',
    icon: WrenchIcon,
    widget: null,
    selectedTabParam: 'configuration',
  },
  {
    name: 'Results',
    icon: ListIcon,
    widget: null,
    selectedTabParam: 'results',
  },
];

export function EdgeJobDetailsHeader({ jobId }: { jobId: number }) {
  const edgeJobQuery = useEdgeJob(jobId);

  return (
    <PageHeader
      title="Edge job details"
      breadcrumbs={[
        { label: 'Edge jobs', link: '/edge/jobs' },
        edgeJobQuery.data?.Name || 'Edge job',
      ]}
    />
  );
}

export function EdgeJobDetailsContent({ jobId }: { jobId: number }) {
  const edgeJobQuery = useEdgeJob(jobId);
  const currentTabIndex = useCurrentTabIndex(JOB_TABS);
  if (!edgeJobQuery.data) return null;

  const edgeJob = edgeJobQuery.data;
  const tabs: Tab[] = [
    {
      ...JOB_TABS[0],
      widget: (
        <div className="row">
          <div className="col-sm-12">
            <Widget>
              <Widget.Body>
                <UpdateEdgeJobForm edgeJob={edgeJob} />
              </Widget.Body>
            </Widget>
          </div>
        </div>
      ),
    },
    {
      ...JOB_TABS[1],
      widget: <ResultsDatatable jobId={edgeJob.Id} />,
    },
  ];

  return (
    <>
      <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
      {tabs[currentTabIndex].widget}
    </>
  );
}

export function EdgeStackCreateContent() {
  return <CreateEdgeStackForm />;
}

export function EdgeStackDetailsHeader({ stackId }: { stackId: number }) {
  const stackQuery = useEdgeStack(stackId);

  return (
    <PageHeader
      title="Edit Edge stack"
      breadcrumbs={[
        { label: 'Edge Stacks', link: '/edge/stacks' },
        stackQuery.data?.Name || 'Edge stack',
      ]}
      reload
    />
  );
}

export function EdgeStackDetailsContent({ stackId }: { stackId: number }) {
  const stackQuery = useEdgeStack(stackId);
  const stack = stackQuery.data;
  const tabs: Tab[] = [
    {
      name: 'Stack',
      icon: LayersIcon,
      widget: (
        <div className="row">
          <div className="col-sm-12">
            <Widget>
              <Widget.Body loading={stackQuery.isLoading}>
                {stackQuery.isError && (
                  <Alert color="error" title="Error loading edge stack" />
                )}
                {stack && <EditEdgeStackForm edgeStack={stack} />}
              </Widget.Body>
            </Widget>
          </div>
        </div>
      ),
      selectedTabParam: 'stack',
    },
    {
      name: 'Environments',
      icon: HardDriveIcon,
      widget: <EdgeStackEnvironmentsDatatable />,
      selectedTabParam: 'environments',
    },
  ];
  const currentTabIndex = useCurrentTabIndex(tabs);
  if (!stack) return null;

  return (
    <>
      <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
      {tabs[currentTabIndex].widget}
    </>
  );
}

function EdgeFormContentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Body>{children}</Widget.Body>
        </Widget>
      </div>
    </div>
  );
}
