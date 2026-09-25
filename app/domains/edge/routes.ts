import { withCurrentUser } from '@/core/routing/guards/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazy-loading/lazyRoute';

const WaitingRoomView = lazyRoute(
  () => import('@/domains/edge/views/edge-devices/WaitingRoomView'),
  'WaitingRoomView'
);
const EdgeGroupCreateView = lazyRoute(
  () => import('@/domains/edge/views/edge-groups/CreateView/CreateView'),
  'CreateView'
);
const EdgeGroupItemView = lazyRoute(
  () => import('@/domains/edge/views/edge-groups/ItemView/ItemView'),
  'ItemView'
);
const EdgeGroupsListView = lazyRoute(
  () => import('@/domains/edge/views/edge-groups/ListView'),
  'ListView'
);
const EdgeJobCreateView = lazyRoute(
  () => import('@/domains/edge/views/edge-jobs/CreateView/CreateView'),
  'CreateView'
);
const EdgeJobItemView = lazyRoute(
  () => import('@/domains/edge/views/edge-jobs/ItemView/ItemView'),
  'ItemView'
);
const EdgeJobsListView = lazyRoute(
  () => import('@/domains/edge/views/edge-jobs/ListView'),
  'ListView'
);
const EdgeStackCreateView = lazyRoute(
  () => import('@/domains/edge/views/edge-stacks/CreateView/CreateView'),
  'CreateView'
);
const EdgeStackItemView = lazyRoute(
  () => import('@/domains/edge/views/edge-stacks/ItemView/ItemView'),
  'ItemView'
);
const EdgeStacksListView = lazyRoute(
  () => import('@/domains/edge/views/edge-stacks/ListView'),
  'ListView'
);

export const EdgeGroupsListRoute = withCurrentUser(EdgeGroupsListView);
export const EdgeGroupCreateRoute = withCurrentUser(EdgeGroupCreateView);
export const EdgeGroupItemRoute = withCurrentUser(EdgeGroupItemView);
export const EdgeStacksListRoute = withCurrentUser(EdgeStacksListView);
export const EdgeStackCreateRoute = withCurrentUser(EdgeStackCreateView);
export const EdgeStackItemRoute = withCurrentUser(EdgeStackItemView);
export const EdgeJobsListRoute = withCurrentUser(EdgeJobsListView);
export const EdgeJobCreateRoute = withCurrentUser(EdgeJobCreateView);
export const EdgeJobItemRoute = withCurrentUser(EdgeJobItemView);
export const WaitingRoomRoute = withCurrentUser(WaitingRoomView);
