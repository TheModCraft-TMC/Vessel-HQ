import { ComponentProps } from 'react';
import { HeartPulse, Server } from 'lucide-react';

import type { ContainerHealth } from '@/domains/containers/models';
import { TableContainer, TableTitle } from '@/ui/components/data-table';
import { Icon } from '@/ui/components/icons/Icon';

import { DetailsTable } from '@@/DetailsTable';

const StatusMode: Record<
  Exclude<ContainerHealth['Status'], undefined | 'none'>,
  ComponentProps<typeof Icon>['mode']
> = {
  healthy: 'success',
  unhealthy: 'danger',
  starting: 'warning',
};

interface Props {
  health: ContainerHealth;
}

export function HealthStatus({ health }: Props) {
  return (
    <TableContainer>
      <TableTitle label="Container health" icon={Server} />

      <DetailsTable dataCy="health-status-table">
        <DetailsTable.Row label="Status">
          {health.Status && health.Status !== 'none' ? (
            <div className="vertical-center">
              <Icon
                icon={HeartPulse}
                mode={StatusMode[health.Status]}
                className="space-right"
              />
              {health.Status}
            </div>
          ) : (
            <div>No health status</div>
          )}
        </DetailsTable.Row>

        <DetailsTable.Row label="Failure count">
          <div className="vertical-center">{health.FailingStreak}</div>
        </DetailsTable.Row>

        {!!health.Log?.length && (
          <DetailsTable.Row label="Last output">
            {health.Log[health.Log.length - 1].Output}
          </DetailsTable.Row>
        )}
      </DetailsTable>
    </TableContainer>
  );
}
