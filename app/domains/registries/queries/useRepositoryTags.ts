import { useQuery } from '@tanstack/react-query';

import { Environment } from '@/domains/environments';
import { ociRemoteProvider, type OciRemoteProvider } from '@/providers/remotes';
import { Registry } from '@/domains/registries/models/registry';
import { queryKeys } from '@/domains/registries/queries/query-keys';

export function useRepositoryTags({
  registryId,
  provider,
  ...params
}: {
  registryId: Registry['Id'];
  repository: string;
  environmentId?: Environment['Id'];
  provider?: OciRemoteProvider;
}) {
  return useQuery({
    queryKey: [...queryKeys.item(registryId), params] as const,
    queryFn: () =>
      getRepositoryTags({
        ...params,
        registryId,
        provider,
        n: 100,
        last: '',
      }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export async function getRepositoryTags(
  {
    environmentId,
    registryId,
    repository,
    n,
    last,
    provider = ociRemoteProvider,
  }: {
    registryId: Registry['Id'];
    repository: string;
    environmentId?: Environment['Id'];
    n?: number;
    last?: string;
    provider?: OciRemoteProvider;
  },
  acc: { name: string; tags: string[] } = { name: '', tags: [] }
): Promise<{ name: string; tags: string[] }> {
  const data = await provider.listTags({
    id: registryId,
    endpointId: environmentId,
    repository,
    n,
    last,
  });
  acc.name = data.name;
  acc.tags = [...acc.tags, ...(data.tags || [])];

  return acc;
}
