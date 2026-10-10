'use client';

import { useMemo } from 'react';

import { useContainers } from '@/domains/containers';
import { ServiceViewModel } from '@/domains/services/models/service';
import { TaskViewModel } from '@/domains/services/models/task';
import { ServicesDatatable } from '@/domains/services/ListView/ServicesDatatable';
import { useServices } from '@/domains/services/queries/useServices';
import { useTasks } from '@/domains/services/queries/useTasks';
import { associateContainerToTask } from '@/domains/services/tasks/utils';
import { associateServiceTasks } from '@/domains/services/utils';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
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
  const services = useMemo(
    () =>
      !isLoading && servicesQuery.data && tasksQuery.data
        ? decorateServices(
            servicesQuery.data,
            tasksQuery.data,
            isAgent ? containersQuery.data || [] : []
          )
        : undefined,
    [
      containersQuery.data,
      isAgent,
      isLoading,
      servicesQuery.data,
      tasksQuery.data,
    ]
  );

  return (
    <>
      <PageHeader title="Service list" breadcrumbs="Services" reload />
      <ServicesDatatable
        dataset={services}
        isAddActionVisible
        isStackColumnVisible
        tableKey="services"
      />
    </>
  );
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
