import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { mutationOptions, withError, withInvalidate } from '@/core/query';
import { ExperimentalFeatures } from '@/domains/settings/models/types';
import { buildUrl } from '@/domains/settings/services/settings.service';

import { queryKeys } from './queryKeys';

export function useUpdateExperimentalSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    updateExperimentalSettings,
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.base()]),
      withError('Unable to update experimental settings')
    )
  );
}

async function updateExperimentalSettings(
  settings: Partial<ExperimentalFeatures>
) {
  try {
    await axios.put(buildUrl('experimental'), settings);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update experimental settings');
  }
}
