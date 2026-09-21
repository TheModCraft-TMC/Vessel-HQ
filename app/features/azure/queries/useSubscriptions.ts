import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/features/environments';
import { withError } from '@/core/query/query-client';

import { azureErrorParser } from '../services/utils';
import { Subscription } from '../types';
import { buildSubscriptionsUrl } from '../services/azure-urls';

import { queryKeys } from './query-keys';

export function useSubscriptions(environmentId: EnvironmentId) {
  return useQuery(
    queryKeys.subscriptions(environmentId),
    () => getSubscriptions(environmentId),
    {
      ...withError('Unable to retrieve Azure subscriptions'),
    }
  );
}

async function getSubscriptions(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<{ value: Subscription[] }>(
      buildSubscriptionsUrl(environmentId),
      { params: { 'api-version': '2016-06-01' } }
    );
    return data.value;
  } catch (e) {
    throw parseAxiosError(
      e,
      'Unable to retrieve subscriptions',
      azureErrorParser
    );
  }
}
