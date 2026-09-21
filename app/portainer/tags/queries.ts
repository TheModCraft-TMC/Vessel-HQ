import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/core/query/query-client';
import { EnvironmentId } from '@/domains/environments';
import { Tag, TagId } from '@/domains/tags';

import { createTag, deleteTag, getTags } from './tags.service';

export const tagKeys = {
  // Stable keys let React Query share and invalidate cached tag data.
  all: ['tags'] as const,
  tag: (id: TagId) => [...tagKeys.all, id] as const,
};

export function useTags<T = Tag[]>({
  select,
  enabled = true,
}: { select?: (tags: Tag[]) => T; enabled?: boolean } = {}) {
  return useQuery(tagKeys.all, () => getTags(), {
    staleTime: 50,
    select,
    enabled,
    ...withError('Failed to retrieve tags'),
  });
}

export function useTagsForEnvironment(environmentId: EnvironmentId) {
  const { data: tags, isLoading } = useTags({
    select: (tags) => tags.filter((tag) => tag.Endpoints[environmentId]),
  });

  return { tags, isLoading };
}

export function useCreateTagMutation() {
  const queryClient = useQueryClient();

  // After a successful create, invalidate the list so the UI fetches fresh tags.
  return useMutation(
    createTag,
    mutationOptions(
      withError('Unable to create tag'),
      withInvalidate(queryClient, [tagKeys.all])
    )
  );
}

export function useDeleteTagsMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    async (tagIds: TagId[]) => Promise.all(tagIds.map((id) => deleteTag(id))),
    mutationOptions(
      withError('Unable to remove tag'),
      withInvalidate(queryClient, [tagKeys.all])
    )
  );
}
