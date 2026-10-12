import axios, { parseAxiosError } from '@/shared/http';
import { EnvironmentId } from '@/domains/environments';

import { buildUrl } from './build-url';
import { Webhook } from './types';

export async function getWebhooks(
  environmentId: EnvironmentId,
  serviceId: string
) {
  try {
    const { data } = await axios.get<Array<Webhook>>(buildUrl(), {
      params: {
        filters: JSON.stringify({
          EndpointID: environmentId,
          ResourceID: serviceId,
        }),
      },
    });
    return data;
  } catch (error) {
    throw parseAxiosError(error);
  }
}
