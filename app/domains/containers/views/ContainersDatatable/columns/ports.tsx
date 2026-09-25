import _ from 'lodash';
import { CellContext } from '@tanstack/react-table';

import { PublishedPortLink } from '@/domains/containers/components/ContainerSupport/PublishedPortLink';
import type { ContainerListViewModel } from '@/domains/containers/types';
import { Badge } from '@/ui/components/status/Badge';
import { TooltipWithChildren } from '@/ui/components/feedback/Tip/TooltipWithChildren';

import { useRowContext } from '../RowContext';

import { columnHelper } from './helper';

const MAX_VISIBLE_PORTS = 3;

export const ports = columnHelper.accessor(
  (row) =>
    _.uniqBy(row.Ports, 'public')
      .map((port) => `${port.public}:${port.private}`)
      .join(','),
  {
    header: 'Published Ports',
    id: 'ports',
    cell: Cell,
  }
);

function Cell({ row }: CellContext<ContainerListViewModel, string>) {
  const ports = _.uniqBy(row.original.Ports, 'public');

  const { environment } = useRowContext();

  if (ports.length === 0) {
    return '-';
  }

  const visiblePorts = ports.slice(0, MAX_VISIBLE_PORTS);
  const hiddenPorts = ports.slice(MAX_VISIBLE_PORTS);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visiblePorts.map((port) => (
        <PublishedPortLink
          key={`${port.host}:${port.public}`}
          hostPort={port.public}
          containerPort={port.private}
          hostURL={environment.PublicURL || port.host}
        />
      ))}
      {hiddenPorts.length > 0 && (
        <TooltipWithChildren
          message={
            <div className="flex flex-wrap gap-1">
              {hiddenPorts.map((port) => (
                <PublishedPortLink
                  key={`${port.host}:${port.public}`}
                  hostPort={port.public}
                  containerPort={port.private}
                  hostURL={environment.PublicURL || port.host}
                />
              ))}
            </div>
          }
        >
          <Badge type="muted" size="sm">
            +{hiddenPorts.length} more
          </Badge>
        </TooltipWithChildren>
      )}
    </div>
  );
}
