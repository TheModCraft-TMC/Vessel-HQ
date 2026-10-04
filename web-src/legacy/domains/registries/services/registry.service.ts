import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import {
  Catalog,
  Registry,
  RegistryId,
} from '@/domains/registries/models/registry';

import { getRemoteProvider } from './remote-provider';

export type RegistryPayload = Omit<Registry, 'Id' | 'RegistryAccesses'> & {
  Password?: string;
  TLS?: boolean;
};

export async function createRegistry(payload: RegistryPayload) {
  try {
    const { data } = await axios.post<Registry>('/registries', payload);
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to create registry');
  }
}

export async function updateRegistry(
  registryId: RegistryId,
  payload: RegistryPayload
) {
  try {
    const { data } = await axios.put<Registry>(
      `/registries/${registryId}`,
      payload
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to update registry');
  }
}

export async function listRegistryCatalogs(registryId: number) {
  try {
    const { data } = await axios.get<Catalog>(
      `/registries/${registryId}/v2/_catalog`
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Failed to get catalog of registry');
  }
}

export async function listRegistryCatalog(
  registry: Pick<Registry, 'Id' | 'Type'>,
  endpointId?: number
) {
  return getRemoteProvider(registry.Type).listCatalog({
    id: registry.Id,
    endpointId,
  });
}
