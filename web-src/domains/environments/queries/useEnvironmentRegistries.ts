import {
  type GenericRegistriesQueryOptions,
  type Registry,
  useGenericRegistriesQuery,
} from '@/domains/registries';
import axios, { parseAxiosError } from '@/shared/http';

import { EnvironmentId } from '../types';

import { environmentQueryKeys } from './query-keys';

export function useEnvironmentRegistries<T = Array<Registry>>(
  environmentId: EnvironmentId,
  queryOptions: GenericRegistriesQueryOptions<T> = {}
) {
  const { namespace } = queryOptions;
  return useGenericRegistriesQuery(
    environmentQueryKeys.registries(environmentId, namespace),
    () => getEnvironmentRegistries(environmentId, { namespace }),
    queryOptions
  );
}

type Params = {
  namespace?: string;
};

async function getEnvironmentRegistries(
  environmentId: EnvironmentId,
  params: Params
) {
  try {
    const { data } = await axios.get<Array<Registry>>(
      `endpoints/${environmentId}/registries`,
      {
        params,
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve registries');
  }
}
