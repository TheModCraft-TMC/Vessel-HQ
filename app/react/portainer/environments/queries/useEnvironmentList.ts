import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import { PlatformType } from '@/react/portainer/environments/types';

import {
  EnvironmentsQueryParams,
  getEnvironments,
} from '../environment.service';

import { environmentQueryKeys } from './query-keys';

export const SortOptions = [
  'Name',
  'Group',
  'Status',
  'PlatformType',
  'LastCheckIn',
  'EdgeID',
  'Health',
  'Id',
] as const;
export type SortType = (typeof SortOptions)[number];
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
  return SortOptions.find((opt) => opt.toLowerCase() === value.toLowerCase());
}

export type Query = EnvironmentsQueryParams & {
  page?: number;
  /** Use 0 to fetch all environments without pagination (backend supports limit=0). */
  pageLimit?: number;
  sort?: SortType;
  order?: 'asc' | 'desc';
};

export function useEnvironmentList(
  { page = 1, pageLimit = 100, sort, order, ...query }: Query = {},
  {
    enabled,
    staleTime,
  }: {
    staleTime?: number;
    enabled?: boolean;
  } = {}
) {
  const { isLoading, data } = useQuery(
    [
      ...environmentQueryKeys.base(),
      { page, pageLimit, sort, order, ...query },
    ],
    async () => {
      const start = pageLimit === 0 ? 0 : (page - 1) * pageLimit + 1;

      return getEnvironments({
        start,
        limit: pageLimit,
        sort: { by: sort, order },
        query,
      });
    },
    {
      staleTime,
      keepPreviousData: true,
      enabled,
      ...withError('Failure retrieving environments'),
    }
  );

  if (data?.value && query && query.platformTypes) {
    const platforms = Array.from(query.platformTypes);

    if (
      platforms.includes(PlatformType.Podman) !==
      platforms.includes(PlatformType.Docker)
    ) {
      const isPodmanSelected = platforms.includes(PlatformType.Podman);
      const containerEngineToExclude = isPodmanSelected ? 'docker' : 'podman';

      const filteredList = data?.value.filter(
        (env) => env.ContainerEngine !== containerEngineToExclude
      );

      return {
        isLoading,
        environments: filteredList,
        totalCount: data ? data.totalCount : 0,
        totalAvailable: data ? data.totalAvailable : 0,
        updateAvailable: data ? data.updateAvailable : false,
      };
    }
  }

  return {
    isLoading,
    environments: data ? data.value : [],
    totalCount: data ? data.totalCount : 0,
    totalAvailable: data ? data.totalAvailable : 0,
    updateAvailable: data ? data.updateAvailable : false,
  };
}
