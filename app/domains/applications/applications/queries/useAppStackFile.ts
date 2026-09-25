import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import { getEdgeStackFile } from '@/domains/edge';
import { getStackFile } from '@/domains/stacks';

import { queryKeys } from './query-keys';

export function useAppStackFile(
  {
    id,
    kind,
  }: {
    id: number | undefined;
    kind?: 'edge' | 'compose' | 'kubernetes' | (string & NonNullable<unknown>);
  },
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(
    queryKeys.appStackFile(id, kind),
    async ({ signal }) => {
      if (!id) {
        return undefined;
      }

      if (kind === 'edge') {
        return getEdgeStackFile(id);
      }

      const stackFile = await getStackFile({
        stackId: id,
        options: { signal },
      });
      return stackFile?.StackFileContent;
    },
    {
      enabled: !!id && enabled,
      ...withError('Failed to load app stack file'),
    }
  );
}
