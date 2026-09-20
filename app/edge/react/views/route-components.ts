import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { lazyRoute } from '@/react-tools/lazyRoute';

const WaitingRoomView = lazyRoute(
  () => import('@/react/edge/edge-devices/WaitingRoomView'),
  'WaitingRoomView'
);
const EdgeGroupCreateView = lazyRoute(
  () => import('@/react/edge/edge-groups/CreateView/CreateView'),
  'CreateView'
);
const EdgeGroupItemView = lazyRoute(
  () => import('@/react/edge/edge-groups/ItemView/ItemView'),
  'ItemView'
);
const EdgeGroupsListView = lazyRoute(
  () => import('@/react/edge/edge-groups/ListView'),
  'ListView'
);
const EdgeJobCreateView = lazyRoute(
  () => import('@/react/edge/edge-jobs/CreateView/CreateView'),
  'CreateView'
);
const EdgeJobItemView = lazyRoute(
  () => import('@/react/edge/edge-jobs/ItemView/ItemView'),
  'ItemView'
);
const EdgeJobsListView = lazyRoute(
  () => import('@/react/edge/edge-jobs/ListView'),
  'ListView'
);
const EdgeStackCreateView = lazyRoute(
  () => import('@/react/edge/edge-stacks/CreateView/CreateView'),
  'CreateView'
);
const EdgeStackItemView = lazyRoute(
  () => import('@/react/edge/edge-stacks/ItemView/ItemView'),
  'ItemView'
);
const EdgeStacksListView = lazyRoute(
  () => import('@/react/edge/edge-stacks/ListView'),
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
