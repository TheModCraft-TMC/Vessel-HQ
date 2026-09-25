import { useQuery } from '@tanstack/react-query';

import { withError } from '@/core/query';

import { PlatformType } from '../types';
import {
  EnvironmentsQueryParams,
  getEnvironments,
  SortOptions,
  SortType,
} from '../services/environments.service';

import { environmentQueryKeys } from './query-keys';

export { SortOptions };
export type { SortType };

export function isSortType(value?: string): value is SortType {
  return SortOptions.includes(value as SortType);
}

export function getSortType(value?: string): SortType | undefined {
  return isSortType(value) ? value : undefined;
}

export function getSortTypeCaseInsensitive(
  value?: string
): SortType | undefined {
  if (!value) return undefined;
  return SortOptions.find(
    (option) => option.toLowerCase() === value.toLowerCase()
  );
}

export type Query = EnvironmentsQueryParams & {
  page?: number;
  pageLimit?: number;
  sort?: SortType;
  order?: 'asc' | 'desc';
};

export function useEnvironmentList(
  { page = 1, pageLimit = 100, sort, order, ...query }: Query = {},
  { enabled, staleTime }: { staleTime?: number; enabled?: boolean } = {}
) {
  const { isLoading, data } = useQuery(
    [
      ...environmentQueryKeys.base(),
      { page, pageLimit, sort, order, ...query },
    ],
    () =>
      getEnvironments({
        start: pageLimit === 0 ? 0 : (page - 1) * pageLimit + 1,
        limit: pageLimit,
        sort: { by: sort, order },
        query,
      }),
    {
      staleTime,
      keepPreviousData: true,
      enabled,
      ...withError('Failure retrieving environments'),
    }
  );

  const environments = data?.value ?? [];
  const platforms = query.platformTypes && Array.from(query.platformTypes);
  const filtered =
    platforms &&
    platforms.includes(PlatformType.Podman) !==
      platforms.includes(PlatformType.Docker)
      ? environments.filter(
          (environment) =>
            environment.ContainerEngine !==
            (platforms.includes(PlatformType.Podman) ? 'docker' : 'podman')
        )
      : environments;

  return {
    isLoading,
    environments: filtered,
    totalCount: data?.totalCount ?? 0,
    totalAvailable: data?.totalAvailable ?? 0,
    updateAvailable: data?.updateAvailable ?? false,
  };
}
