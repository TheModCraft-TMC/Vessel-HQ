import { useQuery } from '@tanstack/react-query';

import type { ExtensionRecord } from '../models/types';
import { extensionSettings } from '../services/settings.service';

export function settingsQueryKey(extension: ExtensionRecord) {
  return [
    'native-extensions',
    'settings',
    extension.id,
    extension.revision,
    extension.manifest.packageDigest,
  ];
}

export function useExtensionSettings(extension: ExtensionRecord) {
  return useQuery({
    queryKey: settingsQueryKey(extension),
    queryFn: ({ signal }) => extensionSettings(extension).read(signal),
    retry: false,
    cacheTime: 0,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
