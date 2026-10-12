import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';
import type { StackFile, StackId } from '@/domains/stacks/models/types';
import { queryKeys } from '@/domains/stacks/queries/common/query-keys';
import axios, { parseAxiosError } from '@/shared/http';

export function useStackFile(
  stackId?: StackId,
  { version, commitHash }: { version?: number; commitHash?: string } = {},
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.stackFile(stackId, { version, commitHash }),
    queryFn: ({ signal }) =>
      getStackFile({
        stackId: stackId!,
        version,
        commitHash,
        options: { signal },
      }),
    ...withError('Unable to retrieve stack'),
    enabled: !!stackId && enabled,
  });
}

export async function getStackFile({
  stackId,
  version,
  commitHash,
  options = {},
}: {
  stackId: StackId;
  version?: number;
  commitHash?: string;
  options?: { signal?: AbortSignal };
}) {
  try {
    const { data } = await axios.get<StackFile>(`/stacks/${stackId}/file`, {
      params: { version, commitHash },
      signal: options.signal,
    });
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve stack file');
  }
}
