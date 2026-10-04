import { useRouteParams } from '@console/console/routing/useRouteParams';
import { AlertTriangle, Code, History, HardDrive } from 'lucide-react';
import { useMemo } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { Badge } from '@/ui/components/status/Badge';
import { Icon } from '@/ui/components/icons/Icon';

import { Widget, WidgetBody, WidgetTabs } from '@@/Widget';
import { Tab, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

import { useEventWarningsCount } from '../../queries/useEvents';
import { ResourceEventsDatatable } from '../../components/EventsDatatable/ResourceEventsDatatable';
import { useNodeQuery } from '../queries/useNodeQuery';

import { NodeApplicationsDatatable } from './NodeApplicationsDatatable/NodeApplicationsDatatable';
import { NodeDetails } from './NodeDetails/NodeDetails';
import { NodeYamlInspector } from './NodeYamlInspector';

export function NodeView() {
  return (
    <>
      <PageHeader title="Node details" breadcrumbs="Cluster" reload />
      <NodeDetailsContent />
    </>
  );
}

export function NodeDetailsContent() {
  const environmentId = useEnvironmentId();
  const { nodeName } = useRouteParams();

  const nodeIdQuery = useNodeQuery(environmentId, nodeName, {
    select: (node) => node.metadata?.uid,
  });
  const eventWarningCount = useEventWarningsCount(environmentId, {
    params: {
      resourceId: nodeIdQuery.data,
    },
    queryOptions: {
      enabled: !!nodeIdQuery.data,
    },
  });

  const tabs = useMemo(
    () =>
      buildTabs(
        eventWarningCount,
        nodeIdQuery.isInitialLoading,
        nodeName,
        environmentId,
        nodeIdQuery.data
      ),
    [
      eventWarningCount,
      nodeIdQuery.isInitialLoading,
      nodeIdQuery.data,
      nodeName,
      environmentId,
    ]
  );
  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
      {tabs[currentTabIndex].widget}
      <NodeApplicationsDatatable />
    </>
  );
}

function buildTabs(
  eventWarningCount: number,
  isLoading: boolean,
  nodeName: string,
  environmentId: number,
  nodeId?: string
): Tab[] {
  return [
    {
      name: 'Node',
      icon: HardDrive,
      widget: (
        <div className="row">
          <div className="col-sm-12">
            <Widget>
              <WidgetBody>
                <NodeDetails
                  nodeName={nodeName}
                  environmentId={environmentId}
                />
              </WidgetBody>
            </Widget>
          </div>
        </div>
      ),
      selectedTabParam: 'namespace',
    },
    {
      name: (
        <div className="flex items-center gap-x-2">
          Events
          {eventWarningCount >= 1 && (
            <Badge type="warnSecondary">
              <Icon icon={AlertTriangle} className="!mr-1" />
              {eventWarningCount}
            </Badge>
          )}
        </div>
      ),
      icon: History,
      widget: (
        <ResourceEventsDatatable
          storageKey="kubernetes.node.events"
          resourceId={nodeId}
          isLoading={isLoading}
          noWidget={false}
        />
      ),
      selectedTabParam: 'events',
    },
    {
      name: 'YAML',
      icon: Code,
      widget: (
        <NodeYamlInspector environmentId={environmentId} nodeName={nodeName} />
      ),
      selectedTabParam: 'yaml',
    },
  ];
}
