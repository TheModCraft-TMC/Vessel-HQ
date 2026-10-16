import { useQuery } from '@tanstack/react-query';

import { getExtensionSlots } from '../services/slots.service';

export function useExtensionSlots(environmentId: number, stackId: number) {
  return useQuery({
    queryKey: ['native-extensions', 'slots', environmentId, stackId],
    queryFn: () => getExtensionSlots(environmentId, stackId),
    enabled: environmentId > 0 && stackId > 0,
    retry: false,
    cacheTime: 0,
  });
}
