'use client';

import { FileText, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useService } from '@/domains/services/queries/useService';
import { useTask } from '@/domains/services/tasks/queries/useTask';
import { isoDate } from '@/portainer/filters/filters';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Button } from '@/ui/components/buttons';
import { TableContainer, TableTitle } from '@/ui/components/data-table';
import { PageHeader } from '@/ui/layouts/view-layout';

import { DetailsTable } from '@@/DetailsTable';

export default function Page() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const params = useRouteParams();
  const taskQuery = useTask(environmentId, params.id);
  const serviceId = taskQuery.data?.ServiceID || '';
  const serviceQuery = useService(environmentId, serviceId);

  if (!taskQuery.data || !serviceQuery.data) return null;

  const task = taskQuery.data;
  const service = serviceQuery.data;
  const image =
    task.Spec?.ContainerSpec?.Image?.replace(/@sha256:.+$/, '') || '';

  return (
    <>
      <PageHeader
        title="Task details"
        breadcrumbs={[
          { label: 'Services', link: '/:endpointId/docker/services' },
          params.id,
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
          {!service.Spec?.Mode?.Global && (
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
                  `/${environmentId}/docker/tasks/${encodeURIComponent(params.id)}/logs`
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
