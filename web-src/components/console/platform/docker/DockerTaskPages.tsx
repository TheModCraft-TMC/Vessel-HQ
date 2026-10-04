'use client';

import { FileText, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useService } from '@/domains/services/queries/useService';
import { useTask } from '@/domains/services/tasks/queries/useTask';
import { isoDate } from '@/portainer/filters/filters';
import { DockerLogsView } from '@/react/docker/logs/DockerLogsView';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Button } from '@/ui/components/buttons';
import { TableContainer, TableTitle } from '@/ui/components/data-table';
import { PageHeader } from '@/ui/layouts/view-layout';

import { DetailsTable } from '@@/DetailsTable';

export function DockerServiceLogsHeader() {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const serviceQuery = useService(environmentId, params.id);
  if (!serviceQuery.data) return null;

  const serviceName = serviceQuery.data.Spec?.Name || params.id;
  return (
    <PageHeader
      title="Service logs"
      breadcrumbs={[
        { label: 'Services', link: '/:endpointId/docker/services' },
        {
          label: serviceName,
          link: '/:endpointId/docker/services/:id',
          linkParams: { id: params.id },
        },
        'Logs',
      ]}
    />
  );
}

export function DockerServiceLogsContent() {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const serviceQuery = useService(environmentId, params.id);
  if (!serviceQuery.data) return null;

  return (
    <DockerLogsView
      environmentId={environmentId}
      resource="services"
      resourceId={params.id}
      resourceName={serviceQuery.data.Spec?.Name || params.id}
      multiplexed
    />
  );
}

export function DockerTaskHeader({ logs = false }: { logs?: boolean }) {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const taskQuery = useTask(environmentId, params.id);
  const serviceId = taskQuery.data?.ServiceID || '';
  const serviceQuery = useService(environmentId, serviceId);
  if (!taskQuery.data || !serviceQuery.data) return null;

  const serviceName = serviceQuery.data.Spec?.Name || serviceId;
  return (
    <PageHeader
      title={logs ? 'Task logs' : 'Task details'}
      breadcrumbs={[
        { label: 'Services', link: '/:endpointId/docker/services' },
        {
          label: serviceName,
          link: '/:endpointId/docker/services/:id',
          linkParams: { id: serviceId },
        },
        ...(logs
          ? [
              {
                label: params.id,
                link: '/:endpointId/docker/tasks/:id',
                linkParams: { id: params.id },
              },
              'Logs',
            ]
          : [params.id]),
      ]}
    />
  );
}

export function DockerTaskLogsContent() {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const taskQuery = useTask(environmentId, params.id);
  if (!taskQuery.data) return null;

  return (
    <DockerLogsView
      environmentId={environmentId}
      resource="tasks"
      resourceId={params.id}
      resourceName={params.id}
      multiplexed
    />
  );
}

export function DockerTaskDetailsContent() {
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
  );
}
