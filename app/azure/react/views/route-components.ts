import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { lazyRoute } from '@/react-tools/lazyRoute';

const CreateView = lazyRoute(
  () => import('@/react/azure/container-instances/CreateView'),
  'CreateView'
);
const ItemView = lazyRoute(
  () => import('@/react/azure/container-instances/ItemView'),
  'ItemView'
);
const ListView = lazyRoute(
  () => import('@/react/azure/container-instances/ListView'),
  'ListView'
);
const DashboardView = lazyRoute(
  () => import('@/react/azure/DashboardView'),
  'DashboardView'
);

export const ContainerInstanceCreateRoute = withCurrentUser(CreateView);
export const ContainerInstanceRoute = withCurrentUser(ItemView);
export const ContainerInstancesListRoute = withCurrentUser(ListView);
export const AzureDashboardRoute = withCurrentUser(DashboardView);
