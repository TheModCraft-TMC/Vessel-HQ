import { CellContext } from '@tanstack/react-table';
import { BarChart } from 'lucide-react';

import { Link } from '@/ui/components/links/Link';
import { Icon } from '@/ui/components/icons/Icon';
import { TooltipWithChildren } from '@/ui/components/feedback/Tip/TooltipWithChildren';

import { NodeRowData } from '../types';

import { columnHelper } from './helper';

export function getActions(metricsEnabled: boolean) {
  return columnHelper.accessor(() => '', {
    header: 'Actions',
    enableSorting: false,
    cell: (props) => (
      <ActionsCell
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        metricsEnabled={metricsEnabled}
      />
    ),
  });
}

function ActionsCell({
  row: { original: node },
  metricsEnabled,
}: CellContext<NodeRowData, string> & {
  metricsEnabled: boolean;
}) {
  const nodeName = node.metadata?.name;

  return (
    <div className="flex gap-1.5">
      {metricsEnabled && (
        <Link
          to="kubernetes.cluster.node.stats"
          params={{ nodeName }}
          className="flex items-center p-1"
          data-cy="nodeStatsButton"
        >
          <TooltipWithChildren message="Stats" position="top">
            <Icon icon={BarChart} />
          </TooltipWithChildren>
        </Link>
      )}
    </div>
  );
}
