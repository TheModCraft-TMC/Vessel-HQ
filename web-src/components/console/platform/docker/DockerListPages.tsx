'use client';

import { useEffect, useState } from 'react';
import moment from 'moment';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { withError } from '@/core/query';
import { useContainers } from '@/domains/containers';
import { useInfo } from '@/domains/containers/hooks/useDockerSystem';
import { ContainersDatatable } from '@/domains/containers/views/ContainersDatatable/ContainersDatatable';
import { EnvironmentType } from '@/domains/environments';
import { ImagesDatatable } from '@/domains/images/views/ListView/ImagesDatatable/ImagesDatatable';
import { PullImageFormWidget } from '@/domains/images/views/ListView/PullImageFormWidget';
import { NetworksDatatable } from '@/domains/networks/components/NetworkList/NetworksDatatable';
import { useDeleteNetworkListMutation } from '@/domains/networks/queries/useDeleteNetworkListMutation';
import { ServiceViewModel } from '@/domains/services/models/service';
import { SecretViewModel } from '@/domains/services/models/secret';
import { TaskViewModel } from '@/domains/services/models/task';
import { ServicesDatatable } from '@/domains/services/ListView/ServicesDatatable';
import { useServices } from '@/domains/services/queries/useServices';
import { useTasks } from '@/domains/services/queries/useTasks';
import {
  getSecrets,
  removeSecret,
} from '@/domains/services/secrets/queries/useSecrets';
import { SecretsDatatable } from '@/domains/services/secrets/ListView/SecretsDatatable';
import { ConfigsDatatable } from '@/domains/services/configs/ListView/ConfigsDatatable/ConfigsDatatable';
import { associateContainerToTask } from '@/domains/services/tasks/utils';
import { associateServiceTasks } from '@/domains/services/utils';
import { StacksDatatable } from '@/domains/stacks/views/ListView/StacksDatatable';
import { DecoratedStack } from '@/domains/stacks/views/ListView/StacksDatatable/types';
import { loadStacks } from '@/domains/stacks/views/ListView/ListView';
import { useDeleteStackMutation } from '@/domains/stacks/queries/common/useDeleteStackMutation';
import { queryKeys as stackQueryKeys } from '@/domains/stacks/queries/common/query-keys';
import { DecoratedVolume } from '@/domains/volumes/models/types';
import { VolumesDatatable } from '@/domains/volumes/components/VolumesDatatable/VolumesDatatable';
import { queryKeys as volumeQueryKeys } from '@/domains/volumes/queries/query-keys';
import { getVolumeList } from '@/domains/volumes/queries/useVolumes';
import { removeVolume } from '@/domains/volumes/services/remove-volume.service';
import { processItemsInBatches } from '@/react/common/processItemsInBatches';
import { EventsDatatable } from '@/react/docker/events/EventsDatatables';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsSwarmAgent } from '@/react/docker/proxy/queries/useIsSwarmAgent';
import { useIsSwarmManager } from '@/react/docker/proxy/queries/useInfo';
import { useEvents } from '@/react/docker/proxy/queries/useEvents';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useCurrentUser, useIsEdgeAdmin } from '@/react/hooks/useUser';
import { getServices } from '@/domains/services';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';

export function DockerConfigsContent() {
  return <ConfigsDatatable />;
}

export function DockerContainersContent() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const swarmQuery = useInfo(environmentId, {
    select: (info) => Boolean(info.Swarm?.NodeID),
  });
  const environment = environmentQuery.data;
  if (!environment) return null;

  const isAgent =
    environment.Type === EnvironmentType.AgentOnDocker ||
    environment.Type === EnvironmentType.EdgeAgentOnDocker;

  return (
    <ContainersDatatable
      isHostColumnVisible={isAgent && Boolean(swarmQuery.data)}
      environment={environment}
    />
  );
}

export function DockerEventsContent() {
  const environmentId = useEnvironmentId();
  const [{ since, until }] = useState(() => ({
    since: moment().subtract(24, 'hour').unix(),
    until: moment().unix(),
  }));
  const eventsQuery = useEvents(environmentId, { params: { since, until } });

  return <EventsDatatable dataset={eventsQuery.data} />;
}

export function DockerNetworksContent() {
  const removeNetworks = useDeleteNetworkListMutation();
  return (
    <NetworksDatatable
      onRemove={(networks) => removeNetworks.mutate({ networks })}
    />
  );
}

export function DockerImagesContent() {
  const isSwarmAgent = useIsSwarmAgent();
  return (
    <div>
      <div className="row">
        <div className="col-sm-12">
          <PullImageFormWidget isNodeVisible={isSwarmAgent} />
        </div>
      </div>
      <ImagesDatatable isHostColumnVisible={isSwarmAgent} />
    </div>
  );
}

export function DockerSecretsContent() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const queryKey = ['docker', environmentId, 'secrets'] as const;
  const secretsQuery = useQuery(
    queryKey,
    async () =>
      (await getSecrets(environmentId)).map(
        (secret: ConstructorParameters<typeof SecretViewModel>[0]) =>
          new SecretViewModel(secret)
      ),
    withError('Unable to retrieve secrets')
  );
  const removeSecretMutation = useMutation(
    (secret: SecretViewModel) => removeSecret(environmentId, secret.Id),
    {
      ...withError('Unable to remove secret'),
      onSuccess: (_data, secret) =>
        notifySuccess('Secret successfully removed', secret.Name),
    }
  );

  return (
    <SecretsDatatable dataset={secretsQuery.data} onRemove={handleRemove} />
  );

  async function handleRemove(secrets: SecretViewModel[]) {
    await processItemsInBatches(secrets, (secret) =>
      removeSecretMutation.mutateAsync(secret)
    );
    await queryClient.invalidateQueries(queryKey);
  }
}

export function DockerServicesContent() {
  const environmentId = useEnvironmentId();
  const agentQuery = useEnvironment(environmentId, (environment) =>
    isAgentEnvironment(environment.Type)
  );
  const isAgent = agentQuery.data || false;
  const servicesQuery = useServices(
    { environmentId },
    { select: (services) => services.map((item) => new ServiceViewModel(item)) }
  );
  const tasksQuery = useTasks(
    { environmentId },
    { select: (tasks) => tasks.map((item) => new TaskViewModel(item)) }
  );
  const containersQuery = useContainers(environmentId, { enabled: isAgent });
  const isLoading =
    agentQuery.isLoading ||
    servicesQuery.isLoading ||
    tasksQuery.isLoading ||
    (isAgent && containersQuery.isLoading);
  const services =
    !isLoading && servicesQuery.data && tasksQuery.data
      ? decorateServices(
          servicesQuery.data,
          tasksQuery.data,
          isAgent ? containersQuery.data || [] : []
        )
      : undefined;

  return (
    <ServicesDatatable
      dataset={services}
      isAddActionVisible
      isStackColumnVisible
      tableKey="services"
    />
  );
}

export function DockerStacksContent() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const { isAdmin, isLoading: isAdminLoading } = useIsEdgeAdmin();
  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteStack = useDeleteStackMutation();
  const stacksQuery = useQuery(
    [...stackQueryKeys.base(), environmentId, 'docker-list', isAdmin],
    () => loadStacks(environmentId, isAdmin),
    { enabled: !isAdminLoading, ...withError('Unable to retrieve stacks') }
  );
  const canManageStacks =
    isAdmin ||
    Boolean(
      environmentQuery.data?.SecuritySettings
        .allowStackManagementForRegularUsers
    );

  useEffect(() => {
    if (!environmentQuery.isLoading && !isAdminLoading && !canManageStacks) {
      router.push(`/${environmentId}/docker/dashboard`);
    }
  }, [
    canManageStacks,
    environmentQuery.isLoading,
    isAdminLoading,
    router,
    environmentId,
  ]);

  if (!canManageStacks) return null;

  return (
    <StacksDatatable
      dataset={stacksQuery.data || []}
      isImageNotificationEnabled={
        environmentQuery.data?.EnableImageNotification || false
      }
      onRemove={handleRemove}
    />
  );

  async function handleRemove(stacks: DecoratedStack[]) {
    await processItemsInBatches(stacks, async (stack) => {
      await deleteStack.mutateAsync({
        id: typeof stack.Id === 'number' ? stack.Id : undefined,
        name: stack.Name,
        external: stack.External,
        environmentId,
      });
      notifySuccess('Stack successfully removed', stack.Name);
    });
    await queryClient.invalidateQueries(stackQueryKeys.base());
  }
}

export function DockerVolumesContent() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();
  const { isPureAdmin } = useCurrentUser();
  const isSwarmManager = useIsSwarmManager(environmentId);
  const environmentQuery = useEnvironment(environmentId);
  const attachedQuery = useQuery(
    [...volumeQueryKeys.base(environmentId), 'attached'],
    () => getVolumeList(environmentId, { dangling: ['false'] }),
    withError('Unable to retrieve attached volumes')
  );
  const danglingQuery = useQuery(
    [...volumeQueryKeys.base(environmentId), 'dangling'],
    () => getVolumeList(environmentId, { dangling: ['true'] }),
    withError('Unable to retrieve dangling volumes')
  );
  const servicesQuery = useQuery(
    ['docker', environmentId, 'volume-services'],
    () => getServices(environmentId),
    { ...withError('Unable to retrieve services'), enabled: isSwarmManager }
  );
  const removeVolumeMutation = useMutation((volume: DecoratedVolume) =>
    removeVolume(environmentId, volume.Name, {
      nodeName: volume.NodeName || '',
    })
  );
  const isLoading =
    attachedQuery.isLoading ||
    danglingQuery.isLoading ||
    (isSwarmManager && servicesQuery.isLoading);
  const volumes = isLoading
    ? undefined
    : decorateVolumes(
        attachedQuery.data || [],
        danglingQuery.data || [],
        servicesQuery.data || []
      );
  const environment = environmentQuery.data;
  const isBrowseVisible = Boolean(
    environment &&
    isAgentEnvironment(environment.Type) &&
    (isPureAdmin ||
      environment.SecuritySettings?.allowVolumeBrowserForRegularUsers)
  );

  return (
    <VolumesDatatable
      dataset={volumes}
      onRemove={handleRemove}
      isBrowseVisible={isBrowseVisible}
    />
  );

  async function handleRemove(volumesToRemove: DecoratedVolume[]) {
    await processItemsInBatches(volumesToRemove, async (volume) => {
      try {
        await removeVolumeMutation.mutateAsync(volume);
        notifySuccess('Volume successfully removed', volume.Name);
      } catch (error) {
        notifyError('Failure', error as Error, 'Unable to remove volume');
      }
    });
    await queryClient.invalidateQueries(volumeQueryKeys.base(environmentId));
  }
}

function decorateServices(
  services: ServiceViewModel[],
  tasks: TaskViewModel[],
  containers: Array<{ Id: string }>
) {
  const decoratedTasks = containers.length
    ? tasks.map((task) => associateContainerToTask(task, containers))
    : tasks;

  return services.map((service) => ({
    ...service,
    Tasks: associateServiceTasks(service, decoratedTasks),
  }));
}

function decorateVolumes(
  attached: Awaited<ReturnType<typeof getVolumeList>>,
  dangling: Awaited<ReturnType<typeof getVolumeList>>,
  services: Awaited<ReturnType<typeof getServices>>
): DecoratedVolume[] {
  const serviceModels = services.map(
    (service) => new ServiceViewModel(service)
  );

  return [
    ...attached.map((volume) => ({ ...volume, dangling: false })),
    ...dangling.map((volume) => ({
      ...volume,
      dangling: !serviceModels.some((service) =>
        service.Mounts?.some((mount) => mount.Source === volume.Name)
      ),
    })),
  ];
}
