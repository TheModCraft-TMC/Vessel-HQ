import { useQuery } from '@tanstack/react-query';

import axios from '@/shared/http';

interface SearchPayload {
  keyword: string;
  reference?: string;
  dirOnly?: boolean;
  sourceId?: number;
}

export function useSearch(payload: SearchPayload, enabled: boolean) {
  return useQuery({
    queryKey: ['gitops', 'search', payload],
    queryFn: () => searchRepo(payload),
    enabled:
      enabled &&
      Number.isSafeInteger(payload.sourceId) &&
      payload.sourceId! > 0,
    retry: false,
    cacheTime: 0,
  });
}

export async function searchRepo(payload: SearchPayload) {
  const { data } = await axios.post<string[] | null>(
    '/gitops/repo/files/search',
    payload
  );
  return data;
}
