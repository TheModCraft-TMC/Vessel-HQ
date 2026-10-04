'use client';

import { useMemo, useState } from 'react';
import { GitCommit, PenBoxIcon, Settings, UsersIcon } from 'lucide-react';

import { AccessTab } from '@/domains/gitops/sources/ItemView/AccessTab';
import { SettingsTab } from '@/domains/gitops/sources/ItemView/SettingsTab/SettingsTab';
import { SourceResourceHeader } from '@/domains/gitops/sources/ItemView/SourceResourceHeader';
import { WorkflowsCountDot } from '@/domains/gitops/sources/ItemView/WorkflowsCountDot';
import { WorkflowsTab } from '@/domains/gitops/sources/ItemView/WorkflowsTab';
import {
  SourceDetail,
  useSource,
} from '@/domains/gitops/sources/queries/useSource';
import { useCurrentUser } from '@/react/hooks/useUser';
import { Button } from '@/ui/components/buttons';
import { Alert } from '@/ui/components/feedback/Alert';
import { Badge } from '@/ui/components/status/Badge';
import { PageHeader } from '@/ui/layouts/view-layout';

import { ResourceDetailHeaderSkeleton } from '@@/ResourceDetailHeader/ResourceDetailHeaderSkeleton';
import { Tab, WidgetTabs, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

export function SourceDetailsHeader({ sourceId }: { sourceId: number }) {
  const sourceQuery = useSource(sourceId);

  return (
    <PageHeader
      breadcrumbs={[
        { label: 'GitOps Sources', link: '/sources' },
        sourceQuery.data?.name || 'Source',
      ]}
      reload={Boolean(sourceQuery.data)}
    />
  );
}

export function SourceDetailsContent({ sourceId }: { sourceId: number }) {
  const sourceQuery = useSource(sourceId);

  if (sourceQuery.isLoading) return <SourceLoading />;
  if (!sourceQuery.data || sourceQuery.isError) {
    return <SourceError error={sourceQuery.error} />;
  }

  return <SourceContent source={sourceQuery.data} />;
}

function SourceContent({ source }: { source: SourceDetail }) {
  const [isEditing, setIsEditing] = useState(false);
  const { isPureAdmin } = useCurrentUser();
  const tabs = useMemo<Array<Tab & { isEditable?: boolean }>>(
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

  return (
    <div className="mx-4 space-y-4 pb-4">
        <SourceResourceHeader source={source} />
        <div className="flex items-center gap-2">
          <WidgetTabs
            tabs={tabs}
            currentTabIndex={currentTabIndex}
            useContainer={false}
          />
          <SourceEditAction
            editable={Boolean(tabs[currentTabIndex]?.isEditable)}
            editing={isEditing}
            onEdit={() => setIsEditing(true)}
          />
        </div>
        {tabs[currentTabIndex].widget}
      </div>
  );
}

function SourceEditAction({
  editable,
  editing,
  onEdit,
}: {
  editable: boolean;
  editing: boolean;
  onEdit(): void;
}) {
  if (!editable) return null;

  return (
    <div className="ml-auto">
      {editing ? (
        <Badge type="info">Editing</Badge>
      ) : (
        <Button
          icon={PenBoxIcon}
          color="light"
          data-cy="edit-settings-button"
          onClick={onEdit}
        >
          Edit
        </Button>
      )}
    </div>
  );
}

function SourceLoading() {
  return (
    <div className="mx-4 mb-4 space-y-4">
      <ResourceDetailHeaderSkeleton statBlockCount={2} />
    </div>
  );
}

function SourceError({ error }: { error: unknown }) {
  return (
    <div className="mx-4 mb-4 space-y-4">
      <Alert color="error">
        Failed loading source:{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    </div>
  );
}
