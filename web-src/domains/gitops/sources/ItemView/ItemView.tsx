import { useMemo, useState } from 'react';
import { GitCommit, PenBoxIcon, Settings, UsersIcon } from 'lucide-react';
import { PageContent } from '@console/layout/PageContent';

import { useIdParam } from '@/core/hooks/useIdParam';
import { useCurrentUser } from '@/core/session/useUser';
import { PageHeader } from '@/ui/layouts/view-layout';
import { Alert } from '@/ui/components/feedback/Alert';
import { Badge } from '@/ui/components/status/Badge';
import { Button } from '@/ui/components/buttons';
import { ResourceDetailHeaderSkeleton } from '@/ui/components/ResourceDetailHeader/ResourceDetailHeaderSkeleton';
import { Tab, WidgetTabs, useCurrentTabIndex } from '@/ui/components/Widget/WidgetTabs';

import { SourceDetail, useSource } from '../queries/useSource';

import { SettingsTab } from './SettingsTab/SettingsTab';
import { WorkflowsTab } from './WorkflowsTab';
import { SourceResourceHeader } from './SourceResourceHeader';
import { WorkflowsCountDot } from './WorkflowsCountDot';
import { AccessTab } from './AccessTab';

const breadcrumbs = [{ label: 'GitOps Sources', link: '/sources' }, 'Source'];

export function ItemView() {
  const sourceId = useIdParam('sourceId');

  const sourceQuery = useSource(sourceId);
  const source = sourceQuery.data;

  if (sourceQuery.isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <PageContent>
          <ResourceDetailHeaderSkeleton statBlockCount={2} />
        </PageContent>
      </>
    );
  }

  if (!source || sourceQuery.isError) {
    const error = sourceQuery.error;
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <PageContent>
          <Alert color="error">
            Failed loading source:{' '}
            {error instanceof Error ? error.message : 'Unknown error'}
          </Alert>
        </PageContent>
      </>
    );
  }

  return <SourceContent source={source} />;
}

function SourceContent({ source }: { source: SourceDetail }) {
  const [isEditing, setIsEditing] = useState(false);
  const { isPureAdmin } = useCurrentUser();

  const tabs: Array<Tab & { isEditable?: boolean }> = useMemo(
    () => [
      {
        name: 'Settings',
        icon: Settings,
        widget: (
          <SettingsTab
            source={source}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
          />
        ),
        selectedTabParam: 'settings',
        isEditable: true,
      },
      {
        name: (
          <>
            Workflows <WorkflowsCountDot sourceId={source.id} />
          </>
        ),
        icon: GitCommit,
        widget: <WorkflowsTab sourceId={source.id} />,
        selectedTabParam: 'workflows',
      },
      {
        name: 'Access',
        icon: UsersIcon,
        widget: (
          <AccessTab
            source={source}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
          />
        ),
        selectedTabParam: 'accessTab',
        isEditable: isPureAdmin,
      },
    ],
    [isEditing, isPureAdmin, source]
  );

  const currentTabIndex = useCurrentTabIndex(tabs);
  const isTabEditable = tabs[currentTabIndex]?.isEditable;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'GitOps Sources', link: '/sources' },
          source.name,
        ]}
        reload
      />
      <PageContent>
        <SourceResourceHeader source={source} />
        <div className="flex items-center gap-2">
          <WidgetTabs
            tabs={tabs}
            currentTabIndex={currentTabIndex}
            useContainer={false}
          />
          <div className="ml-auto">
            {isTabEditable &&
              (isEditing ? (
                <Badge type="info">Editing</Badge>
              ) : (
                <Button
                  icon={PenBoxIcon}
                  color="light"
                  data-cy="edit-settings-button"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              ))}
          </div>
        </div>
        {tabs[currentTabIndex].widget}
      </PageContent>
    </>
  );
}
