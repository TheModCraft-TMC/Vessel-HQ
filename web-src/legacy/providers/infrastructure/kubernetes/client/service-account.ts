import http from '@/shared/http';

import { KubernetesServiceAccountDto } from '../dto/service-account';
import { parseKubernetesError } from '../errors/parse-kubernetes-error';

export async function getServiceAccounts(
  environmentId: number,
  namespace: string
): Promise<KubernetesServiceAccountDto[]> {
  try {
    const { data } = await http.get<{
      items: KubernetesServiceAccountDto[];
    }>(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespace}/serviceaccounts`
    );
    return data.items;
  } catch (error) {
    throw parseKubernetesError(error, 'Unable to retrieve service accounts');
  }
}
