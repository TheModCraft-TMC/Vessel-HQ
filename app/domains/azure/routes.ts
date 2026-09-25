import { withCurrentUser } from '@/core/routing/guards/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazy-loading/lazyRoute';

const CreateView = lazyRoute(
  () => import('@/domains/azure/views/ContainerInstances/CreateView'),
  'CreateView'
);
const ItemView = lazyRoute(
  () => import('@/domains/azure/views/ContainerInstances/ItemView'),
  'ItemView'
);
const ListView = lazyRoute(
  () => import('@/domains/azure/views/ContainerInstances/ListView'),
  'ListView'
);
const DashboardView = lazyRoute(
  () => import('@/domains/azure/views/DashboardView'),
  'DashboardView'
);

export const ContainerInstanceCreateRoute = withCurrentUser(CreateView);
export const ContainerInstanceRoute = withCurrentUser(ItemView);
export const ContainerInstancesListRoute = withCurrentUser(ListView);
export const AzureDashboardRoute = withCurrentUser(DashboardView);
