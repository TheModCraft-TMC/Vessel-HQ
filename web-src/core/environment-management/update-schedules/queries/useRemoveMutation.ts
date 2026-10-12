import { useQueryClient, useMutation } from '@tanstack/react-query';

import { promiseSequence } from '@/shared/promise-utils';
import axios, { parseAxiosError } from '@/shared/http';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/core/query';

import { EdgeUpdateSchedule } from '../types';

import { buildUrl } from './urls';
import { queryKeys } from './query-keys';

export function useRemoveMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    (schedules: EdgeUpdateSchedule[]) =>
      promiseSequence(
        schedules.map((schedule) => () => deleteUpdateSchedule(schedule.id))
      ),

    mutationOptions(
      withInvalidate(queryClient, [queryKeys.base()]),
      withError()
    )
  );
}

async function deleteUpdateSchedule(id: EdgeUpdateSchedule['id']) {
  try {
    const { data } = await axios.delete<EdgeUpdateSchedule[]>(buildUrl(id));
    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to delete edge update schedule'
    );
  }
}
