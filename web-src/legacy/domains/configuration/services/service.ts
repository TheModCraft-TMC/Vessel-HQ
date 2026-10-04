import { ServiceList } from 'kubernetes-types/core/v1';

import type { EnvironmentId } from '@/domains/environments';
import { kubernetesResourceClient } from '@/providers/infrastructure/kubernetes';

import type { Service } from './types';

export const queryKeys = {
  clusterServices: (environmentId: EnvironmentId) =>
    ['environments', environmentId, 'kubernetes', 'services'] as const,
};

// get a list of services for a specific namespace from the Portainer API
export async function getServices(
  environmentId: EnvironmentId,
  namespace: string,
  withApplications?: boolean
) {
  if (!namespace) {
    return [];
  }
  return kubernetesResourceClient.get<Array<Service>>(
    `kubernetes/${environmentId}/namespaces/${namespace}/services`,
    { params: { withApplications } },
    'Unable to retrieve services'
  );
}

export async function getClusterServices(
  environmentId: EnvironmentId,
  withApplications?: boolean
) {
  return kubernetesResourceClient.get<Array<Service>>(
    `kubernetes/${environmentId}/services`,
    { params: { withApplications } },
    'Unable to retrieve services'
  );
}

// getNamespaceServices is used to get a list of services for a specific namespace
// it calls the kubernetes api directly and not the portainer api
export async function getNamespaceServices(
  environmentId: EnvironmentId,
  namespace: string,
  queryParams?: Record<string, string>
) {
  const services = await kubernetesResourceClient.get<ServiceList>(
    `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/services`,
    { params: queryParams },
    'Unable to retrieve services'
  );
  return services.items;
}

export async function getService<T extends Service | string = Service>(
  environmentId: EnvironmentId,
  namespace: string,
  serviceName: string,
  yaml?: boolean
) {
  return kubernetesResourceClient.get<T>(
    `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/services/${serviceName}`,
    { headers: { Accept: yaml ? 'application/yaml' : 'application/json' } },
    'Unable to retrieve service'
  );
}

export async function deleteServices({
  environmentId,
  data,
}: {
  environmentId: EnvironmentId;
  data: Record<string, string[]>;
}) {
  return kubernetesResourceClient.post(
    `kubernetes/${environmentId}/services/delete`,
    data,
    undefined,
    'Unable to delete service(s)'
  );
}
