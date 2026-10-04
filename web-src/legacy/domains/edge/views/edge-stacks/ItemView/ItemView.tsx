import { HardDriveIcon, LayersIcon } from 'lucide-react';

import { EditEdgeStackForm } from '@/domains/edge/views/edge-stacks/ItemView/EditEdgeStackForm/EditEdgeStackForm';
import { useIdParam } from '@/react/hooks/useIdParam';
import { Alert } from '@/ui/components/feedback/Alert';
import { PageHeader } from '@/ui/layouts/view-layout';
import { useEdgeStack } from '@/domains/edge/queries/edge-stacks/useEdgeStack';

import { Widget } from '@@/Widget';
import { Tab, useCurrentTabIndex, WidgetTabs } from '@@/Widget/WidgetTabs';

import { EnvironmentsDatatable } from './EnvironmentsDatatable';

export function ItemView() {
  const idParam = useIdParam('stackId');
  const edgeStackQuery = useEdgeStack(idParam);

  const stack = edgeStackQuery.data;

  const tabs: Tab[] = [
    {
      name: 'Stack',
      icon: LayersIcon,
      widget: (
        <div className="row">
          <div className="col-sm-12">
            <Widget>
              <Widget.Body loading={edgeStackQuery.isLoading}>
                {edgeStackQuery.isError && (
                  <Alert color="error" title="Error loading edge stack" />
                )}
                {!!stack && <EditEdgeStackForm edgeStack={stack} />}
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
      widget: <EnvironmentsDatatable />,
      selectedTabParam: 'environments',
    },
  ];

  const currentTabIndex = useCurrentTabIndex(tabs);

  if (!edgeStackQuery.data) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Edit Edge stack"
        breadcrumbs={[
          { label: 'Edge Stacks', link: '/edge/stacks' },
          stack?.Name ?? '',
        ]}
        reload
      />

      <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
      {tabs[currentTabIndex].widget}
    </>
  );
}
