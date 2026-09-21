import { withCurrentUser } from '@/core/routing/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazyRoute';

const CreateView = lazyRoute(
  () => import('@/domains/azure/container-instances/CreateView'),
  'CreateView'
);
const ItemView = lazyRoute(
  () => import('@/domains/azure/container-instances/ItemView'),
  'ItemView'
);
const ListView = lazyRoute(
  () => import('@/domains/azure/container-instances/ListView'),
  'ListView'
);
const DashboardView = lazyRoute(
  () => import('@/domains/azure/DashboardView'),
  'DashboardView'
);

export const ContainerInstanceCreateRoute = withCurrentUser(CreateView);
export const ContainerInstanceRoute = withCurrentUser(ItemView);
export const ContainerInstancesListRoute = withCurrentUser(ListView);
export const AzureDashboardRoute = withCurrentUser(DashboardView);
