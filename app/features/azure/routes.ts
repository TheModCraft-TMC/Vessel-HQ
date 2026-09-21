import { withCurrentUser } from '@/core/routing/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazyRoute';

const CreateView = lazyRoute(
  () => import('@/features/azure/container-instances/CreateView'),
  'CreateView'
);
const ItemView = lazyRoute(
  () => import('@/features/azure/container-instances/ItemView'),
  'ItemView'
);
const ListView = lazyRoute(
  () => import('@/features/azure/container-instances/ListView'),
  'ListView'
);
const DashboardView = lazyRoute(
  () => import('@/features/azure/DashboardView'),
  'DashboardView'
);

export const ContainerInstanceCreateRoute = withCurrentUser(CreateView);
export const ContainerInstanceRoute = withCurrentUser(ItemView);
export const ContainerInstancesListRoute = withCurrentUser(ListView);
export const AzureDashboardRoute = withCurrentUser(DashboardView);
