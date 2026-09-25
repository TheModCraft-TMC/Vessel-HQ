import { lazyRoute } from '@/core/routing/lazy-loading/lazyRoute';

export * from './types';
export type { DockerSnapshot } from './models/snapshot';
export {
  getEnvironment,
  getEnvironments,
} from './services/environments.service';
export type {
  BaseEnvironmentsQueryParams,
  EnvironmentsQueryParams,
  GetEnvironmentsOptions,
  EnvironmentListResult,
  SortType,
} from './services/environments.service';
export { environmentQueryKeys } from './queries/query-keys';
export { useEnvironment } from './queries/useEnvironment';
export { EdgeKeyDisplay } from './views/EnvironmentDetail/EdgeKeyDisplay';
export { HomepageFilter } from './views/EnvironmentList/HomepageFilter';
export {
  getSortType,
  getSortTypeCaseInsensitive,
  isSortType,
  SortOptions,
  useEnvironmentList,
} from './queries/useEnvironmentList';
export type { Query as EnvironmentListQuery } from './queries/useEnvironmentList';
export const EnvironmentItemView = lazyRoute(
  () => import('./views/EnvironmentDetail'),
  'ItemView'
);
export const EnvironmentsHomeView = lazyRoute(
  () => import('./views/HomeView'),
  'HomeView'
);
