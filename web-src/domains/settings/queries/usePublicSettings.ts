import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { getPublicSettings } from '@/domains/settings/services/settings.service';
import { PublicSettingsResponse } from '@/domains/settings/models/types';

import { queryKeys } from './queryKeys';

export function usePublicSettings<T = PublicSettingsResponse>({
  enabled,
  select,
  onSuccess,
}: {
  select?: (settings: PublicSettingsResponse) => T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
} = {}) {
  return useQuery(queryKeys.public(), getPublicSettings, {
    select,
    ...withError('Unable to retrieve public settings'),
    enabled,
    onSuccess,
  });
}
