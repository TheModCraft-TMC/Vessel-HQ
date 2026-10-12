import { EnvironmentId } from '@/domains/environments';
import { kubernetesResourceClient } from '@/providers/infrastructure/kubernetes';

import { Ingress, DeleteIngressesRequest, IngressController } from './types';

export async function getIngress(
  environmentId: EnvironmentId,
  namespace: string,
  ingressName: string
) {
  const ingress = await kubernetesResourceClient.get<Ingress[]>(
    buildUrl(environmentId, namespace, ingressName),
    undefined,
    'Unable to retrieve the ingress'
  );
  return ingress[0];
}

export async function getIngresses(
  environmentId: EnvironmentId,
  params?: { withServices?: boolean }
) {
  return kubernetesResourceClient.get<Ingress[]>(
    `kubernetes/${environmentId}/ingresses`,
    { params },
    'Unable to retrieve ingresses'
  );
}

export async function getIngressControllers(
  environmentId: EnvironmentId,
  namespace: string,
  allowedOnly?: boolean
) {
  return kubernetesResourceClient.get<IngressController[]>(
    `kubernetes/${environmentId}/namespaces/${namespace}/ingresscontrollers`,
    allowedOnly ? { params: { allowedOnly: true } } : undefined,
    'Unable to retrieve ingresses'
  );
}

export async function createIngress(
  environmentId: EnvironmentId,
  ingress: Ingress
) {
  return kubernetesResourceClient.post(
    buildUrl(environmentId, ingress.Namespace),
    ingress,
    undefined,
    'Unable to create an ingress'
  );
}

export async function updateIngress(
  environmentId: EnvironmentId,
  ingress: Ingress
) {
  await kubernetesResourceClient.put(
    buildUrl(environmentId, ingress.Namespace),
    ingress,
    undefined,
    'Unable to update an ingress'
  );
}

export async function deleteIngresses(
  environmentId: EnvironmentId,
  data: DeleteIngressesRequest
) {
  return kubernetesResourceClient.post(
    `kubernetes/${environmentId}/ingresses/delete`,
    data,
    undefined,
    'Unable to delete ingresses'
  );
}

function buildUrl(
  environmentId: EnvironmentId,
  namespace: string,
  ingressName?: string
) {
  let url = `kubernetes/${environmentId}/namespaces/${namespace}/ingresses`;

  if (ingressName) {
    url += `/${ingressName}`;
  }

  return url;
}
