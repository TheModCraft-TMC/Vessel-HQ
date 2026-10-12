import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/shared/http';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/core/query';
import { EdgeGroup, edgeGroupQueryKeys } from '@/domains/edge';
import { TagId } from '@/domains/tags';
import { queryKeys as groupQueryKeys } from '@/core/environment-management/environment-groups/queries/query-keys';
import { tagKeys } from '@/domains/tags';
import { EnvironmentId, EnvironmentGroupId } from '@/domains/environments';

import { buildUrl } from '../environment.service/utils';

import { environmentQueryKeys } from './query-keys';

export function useUpdateEnvironmentsRelationsMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    updateEnvironmentRelations,
    mutationOptions(
      withInvalidate(queryClient, [
        environmentQueryKeys.base(),
        edgeGroupQueryKeys.base(),
        groupQueryKeys.base(),
        tagKeys.all,
      ]),
      withError('Unable to update environment relations')
    )
  );
}

export interface EnvironmentRelationsPayload {
  edgeGroups: Array<EdgeGroup['Id']>;
  group: EnvironmentGroupId;
  tags: Array<TagId>;
}

export async function updateEnvironmentRelations(
  relations: Record<EnvironmentId, EnvironmentRelationsPayload>
) {
  try {
    await axios.put(buildUrl(undefined, 'relations'), { relations });
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update environment relations');
  }
}
