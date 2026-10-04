import { useRouteParams } from '@console/console/routing/useRouteParams';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { FileText, List } from 'lucide-react';

import { isoDate } from '@/portainer/filters/filters';
import { useService } from '@/domains/services/queries/useService';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Button } from '@/ui/components/buttons';
import { PageHeader } from '@/ui/layouts/view-layout';
import { TableContainer, TableTitle } from '@/ui/components/data-table';

import { DetailsTable } from '@@/DetailsTable';

import { useTask } from '../queries/useTask';

export function ItemView() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const pathname = usePathname();
  const { id } = useRouteParams();
  const taskQuery = useTask(environmentId, id);
  const serviceId = taskQuery.data?.ServiceID || '';
  const serviceQuery = useService(environmentId, serviceId);

  if (!taskQuery.data || !serviceQuery.data) {
    return null;
  }

  const task = taskQuery.data;
  const service = serviceQuery.data;
  const serviceName = service.Spec?.Name || serviceId;
  const image =
    task.Spec?.ContainerSpec?.Image?.replace(/@sha256:.+$/, '') || '';
  const isGlobal = Boolean(service.Spec?.Mode?.Global);

  return (
    <>
      <PageHeader
        title="Task details"
        breadcrumbs={[
          { label: 'Services', link: '/:endpointId/docker/services' },
          {
            label: serviceName,
            link: '/:endpointId/docker/services/:id',
            linkParams: { id: serviceId },
          },
          id,
        ]}
      />
      <TableContainer>
        <TableTitle label="Task status" icon={List} />
        <DetailsTable dataCy="taskDetails-detailsTable">
          <DetailsTable.Row label="ID">{task.ID}</DetailsTable.Row>
          <DetailsTable.Row label="State">
            <span className="label label-default">{task.Status?.State}</span>
          </DetailsTable.Row>
          <DetailsTable.Row label="State message">
            {task.Status?.Message}
          </DetailsTable.Row>
          {task.Status?.Err && (
            <DetailsTable.Row label="Error message">
              <code>{task.Status.Err}</code>
            </DetailsTable.Row>
          )}
          <DetailsTable.Row label="Image">{image}</DetailsTable.Row>
          {!isGlobal && (
            <DetailsTable.Row label="Slot">{task.Slot}</DetailsTable.Row>
          )}
          <DetailsTable.Row label="Created">
            {isoDate(task.CreatedAt)}
          </DetailsTable.Row>
          {task.Status?.ContainerStatus?.ContainerID && (
            <DetailsTable.Row label="Container ID">
              {task.Status.ContainerStatus.ContainerID}
            </DetailsTable.Row>
          )}
          <DetailsTable.Row label="Actions">
            <Button
              icon={FileText}
              onClick={() =>
                router.push(
                  buildHref(
                    '/:endpointId/docker/tasks/:id/logs',
                    { id },
                    pathname
                  )
                )
              }
              data-cy="taskDetails-logsButton"
            >
              Task logs
            </Button>
          </DetailsTable.Row>
        </DetailsTable>
      </TableContainer>
    </>
  );
}
