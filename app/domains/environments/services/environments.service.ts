import { endpointInspect, endpointList } from '@api/sdk.gen';
import type { EndpointListData } from '@api/types.gen';

import type { TagId } from '@/domains/tags';

import {
  EdgeGroupId,
  Environment,
  EnvironmentGroupId,
  EnvironmentId,
  EnvironmentStatus,
  EnvironmentType,
  PlatformType,
} from '../types';
import { toEnvironment } from '../mappers';

export interface BaseEnvironmentsQueryParams {
  search?: string;
  types?: EnvironmentType[] | readonly EnvironmentType[];
  tagIds?: TagId[];
  endpointIds?: EnvironmentId[];
  excludeIds?: EnvironmentId[];
  excludeGroupIds?: EnvironmentGroupId[];
  tagsPartialMatch?: boolean;
  groupIds?: EnvironmentGroupId[];
  status?: EnvironmentStatus[];
  edgeAsync?: boolean;
  edgeDeviceUntrusted?: boolean;
  excludeSnapshots?: boolean;
  name?: string;
  nameFilter?: string;
  agentVersions?: string[];
  updateInformation?: boolean;
  edgeCheckInPassedSeconds?: number;
  platformTypes?: PlatformType[];
  edgeGroupIds?: EdgeGroupId[];
  excludeEdgeGroupIds?: EdgeGroupId[];
  outdated?: boolean;
}

export type EnvironmentsQueryParams = BaseEnvironmentsQueryParams & {
  edgeStackId?: number;
  edgeStackStatus?: number;
};

export interface GetEnvironmentsOptions {
  start?: number;
  limit?: number;
  sort?: { by?: SortType; order?: 'asc' | 'desc' };
  query?: EnvironmentsQueryParams;
}

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

export interface EnvironmentListResult {
  totalCount: number;
  value: Environment[];
  totalAvailable: number;
  updateAvailable: boolean;
}

export async function getEnvironments({
  start,
  limit,
  sort = { order: 'asc' },
  query = {},
}: GetEnvironmentsOptions = {}): Promise<EnvironmentListResult> {
  if (query.tagIds?.length === 0 || query.endpointIds?.length === 0) {
    return {
      totalCount: 0,
      value: [],
      totalAvailable: 0,
      updateAvailable: false,
    };
  }

  const response = await endpointList({
    query: {
      start,
      limit,
      sort: sort.by,
      order: sort.order,
      ...query,
      types: query.types ? [...query.types] : undefined,
    } as EndpointListData['query'],
  });

  return {
    totalCount: Number(response.headers['x-total-count'] || 0),
    value: (response.data ?? []).map(toEnvironment),
    totalAvailable: Number(response.headers['x-total-available'] || 0),
    updateAvailable: response.headers['x-update-available'] === 'true',
  };
}

export async function getEnvironment(
  id: EnvironmentId,
  excludeSnapshot = true
) {
  const response = await endpointInspect({
    path: { id: Number(id) },
    query: { excludeSnapshot },
  });
  return toEnvironment(response.data);
}
