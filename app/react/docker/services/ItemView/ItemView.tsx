import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import YAML from 'yaml';
import { Code, FileText, List, RefreshCw, RotateCcw } from 'lucide-react';

import { ServiceViewModel } from '@/docker/models/service';
import { TaskViewModel } from '@/docker/models/task';
import { isoDate } from '@/portainer/filters/filters';
import { notifyError, notifySuccess } from '@/portainer/services/notifications';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { useTasks } from '@/react/docker/proxy/queries/tasks/useTasks';

import { Button, ButtonGroup, LoadingButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { DetailsTable } from '@@/DetailsTable';
import { PageHeader } from '@@/PageHeader';
import { TableContainer, TableTitle } from '@@/datatables';
import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';
import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { Widget } from '@@/Widget';

import { convertServiceToConfig } from '../common/convertServiceToConfig';
import { confirmServiceForceUpdate } from '../common/update-service-modal';
import { queryKeys } from '../queries/query-keys';
import { useService } from '../queries/useService';
import { useUpdateServiceMutation } from '../queries/useUpdateServiceMutation';
import { ServiceUpdateConfig } from '../types';
import { useForceUpdateServicesMutation } from '../ListView/ServicesDatatable/useForceUpdateServicesMutation';
import { useRemoveServicesMutation } from '../ListView/ServicesDatatable/useRemoveServicesMutation';

import { TasksDatatable } from './TasksDatatable';

export function ItemView() {
  const environmentId = useEnvironmentId();
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const serviceQuery = useService(environmentId, id);
  const tasksQuery = useTasks<TaskViewModel[]>(
    { environmentId, filters: { service: [id] } },
    { select: (tasks) => tasks.map((task) => new TaskViewModel(task)) }
  );

  if (!serviceQuery.data) {
    return null;
  }

  const service = new ServiceViewModel(serviceQuery.data);

  return (
    <ServiceDetails
      key={`${service.Id}-${service.Version}`}
      environmentId={environmentId}
      service={service}
      tasks={tasksQuery.data || []}
    />
  );
}

function ServiceDetails({
  environmentId,
  service,
  tasks,
}: {
  environmentId: number;
  service: ServiceViewModel;
  tasks: TaskViewModel[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const initialValue = useMemo(
    () => YAML.stringify(convertServiceToConfig(service.Model)),
    [service.Model]
  );
  const [editorValue, setEditorValue] = useState(initialValue);
  const [editorError, setEditorError] = useState('');
  const updateMutation = useUpdateServiceMutation(environmentId);
  const forceUpdateMutation = useForceUpdateServicesMutation(environmentId);
  const removeMutation = useRemoveServicesMutation(environmentId);
  const isBusy =
    updateMutation.isLoading ||
    forceUpdateMutation.isLoading ||
    removeMutation.isLoading;
  usePreventExit(initialValue, editorValue, !updateMutation.isSuccess);

  return (
    <>
      <PageHeader
        title="Service details"
        breadcrumbs={[
          { label: 'Services', link: 'docker.services' },
          service.Name,
        ]}
        reload
      />

      <TableContainer>
        <TableTitle label="Service details" icon={FileText} />
        <DetailsTable dataCy="service-details-table">
          <DetailsTable.Row label="Name">{service.Name}</DetailsTable.Row>
          <DetailsTable.Row label="ID">{service.Id}</DetailsTable.Row>
          <DetailsTable.Row label="Image">
            {service.Image || '-'}
          </DetailsTable.Row>
          <DetailsTable.Row label="Scheduling mode">
            {service.Mode}
          </DetailsTable.Row>
          {service.Mode === 'replicated' && (
            <DetailsTable.Row label="Replicas">
              {service.Replicas ?? 0}
            </DetailsTable.Row>
          )}
          <DetailsTable.Row label="Created">
            {service.CreatedAt ? isoDate(service.CreatedAt) : '-'}
          </DetailsTable.Row>
          <DetailsTable.Row label="Last updated">
            {service.UpdatedAt ? isoDate(service.UpdatedAt) : '-'}
          </DetailsTable.Row>
        </DetailsTable>
        <div className="flex flex-wrap gap-2 p-4">
          <Authorized authorizations="DockerServiceLogs">
            <Button
              color="secondary"
              icon={List}
              onClick={() =>
                router.stateService.go('docker.services.service.logs', {
                  id: service.Id,
                })
              }
              data-cy="service-logs-button"
            >
              Service logs
            </Button>
          </Authorized>
          <Authorized authorizations="DockerServiceUpdate">
            <Button
              color="secondary"
              icon={RefreshCw}
              disabled={isBusy}
              onClick={handleForceUpdate}
              data-cy="service-force-update-button"
            >
              Force update
            </Button>
            <Button
              color="secondary"
              icon={RotateCcw}
              disabled={isBusy}
              onClick={handleRollback}
              data-cy="service-rollback-button"
            >
              Rollback
            </Button>
          </Authorized>
          <Authorized authorizations="DockerServiceDelete">
            <DeleteButton
              disabled={isBusy}
              onConfirmed={handleRemove}
              confirmMessage="Do you want to remove this service? All containers associated with it will also be removed."
              data-cy="service-delete-button"
            >
              Delete service
            </DeleteButton>
          </Authorized>
        </div>
      </TableContainer>

      <AccessControlPanel
        resourceId={service.Id}
        resourceControl={service.ResourceControl}
        resourceType={ResourceControlType.Service}
        environmentId={environmentId}
        onUpdateSuccess={() =>
          queryClient.invalidateQueries(
            queryKeys.service(environmentId, service.Id)
          )
        }
      />

      <Widget aria-label="Service specification">
        <Widget.Title title="Service specification" icon={Code} />
        <Widget.Body>
          <form className="form-horizontal" onSubmit={handleUpdate}>
            <WebEditorForm
              id="service-spec-editor"
              titleContent="Docker service specification"
              value={editorValue}
              onChange={(value) => {
                setEditorValue(value);
                setEditorError('');
              }}
              error={editorError}
              textTip="Edit the complete Docker service specification. Advanced Swarm fields are preserved."
              data-cy="service-spec-editor"
              height="600px"
            />
            <Authorized authorizations="DockerServiceUpdate">
              <ButtonGroup className="mt-4">
                <LoadingButton
                  type="submit"
                  isLoading={updateMutation.isLoading}
                  loadingText="Updating service..."
                  disabled={editorValue === initialValue || isBusy}
                  data-cy="service-update-button"
                >
                  Apply changes
                </LoadingButton>
                <Button
                  color="default"
                  disabled={editorValue === initialValue || isBusy}
                  onClick={() => {
                    setEditorValue(initialValue);
                    setEditorError('');
                  }}
                  data-cy="service-reset-button"
                >
                  Reset changes
                </Button>
              </ButtonGroup>
            </Authorized>
          </form>
        </Widget.Body>
      </Widget>

      <TasksDatatable
        dataset={tasks}
        isSlotColumnVisible={service.Mode === 'replicated'}
        serviceName={service.Name}
      />
    </>
  );

  async function refreshService() {
    await queryClient.invalidateQueries(
      queryKeys.service(environmentId, service.Id)
    );
    await queryClient.invalidateQueries(queryKeys.list(environmentId));
  }

  function handleUpdate(event: React.FormEvent) {
    event.preventDefault();
    const config = parseServiceSpec(editorValue, setEditorError);
    if (!config) {
      return;
    }

    updateMutation.mutate(
      {
        environmentId,
        serviceId: service.Id,
        config,
        version: service.Version || 0,
      },
      {
        onSuccess: async () => {
          notifySuccess('Success', 'Service successfully updated');
          await refreshService();
        },
      }
    );
  }

  async function handleForceUpdate() {
    const result = await confirmServiceForceUpdate(
      'Do you want to force an update of this service? All associated tasks will be recreated.'
    );
    if (!result) {
      return;
    }

    forceUpdateMutation.mutate(
      { ids: [service.Id], pullImage: result.pullLatest },
      {
        onSuccess: async () => {
          notifySuccess('Success', 'Service successfully updated');
          await refreshService();
        },
      }
    );
  }

  async function handleRollback() {
    const confirmed = await confirm({
      title: 'Rollback service',
      message:
        'Are you sure you want to roll back to the previous service specification?',
      modalType: ModalType.Warn,
      confirmButton: buildConfirmButton('Rollback', 'danger'),
    });
    if (!confirmed) {
      return;
    }

    const config = parseServiceSpec(editorValue, setEditorError);
    if (!config) {
      return;
    }
    updateMutation.mutate(
      {
        environmentId,
        serviceId: service.Id,
        config,
        version: service.Version || 0,
        rollback: 'previous',
      },
      {
        onSuccess: async () => {
          notifySuccess('Success', 'Service successfully rolled back');
          await refreshService();
        },
      }
    );
  }

  function handleRemove() {
    removeMutation.mutate([service.Id], {
      onSuccess: () => {
        notifySuccess('Success', 'Service successfully deleted');
        router.stateService.go('docker.services');
      },
    });
  }
}

function parseServiceSpec(
  value: string,
  setError: (error: string) => void
): ServiceUpdateConfig | undefined {
  try {
    const parsed = YAML.parse(value) as Partial<ServiceUpdateConfig> | null;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('The service specification must be a YAML object.');
    }
    if (!parsed.Name || typeof parsed.Name !== 'string') {
      throw new Error('The service specification requires a Name.');
    }
    if (!parsed.TaskTemplate || typeof parsed.TaskTemplate !== 'object') {
      throw new Error('The service specification requires a TaskTemplate.');
    }

    return {
      ...parsed,
      Name: parsed.Name,
      Labels: parsed.Labels || {},
      TaskTemplate: parsed.TaskTemplate,
      Mode: parsed.Mode || {},
      UpdateConfig: parsed.UpdateConfig || {},
      Networks: parsed.Networks || [],
      EndpointSpec: parsed.EndpointSpec || {},
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setError(message);
    notifyError('Invalid service specification', new Error(message));
    return undefined;
  }
}
