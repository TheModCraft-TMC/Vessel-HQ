import { withCurrentUser } from '@/core/routing/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazyRoute';

const ConfigsListView = lazyRoute(
  () => import('@/react/docker/configs/ListView/ListView'),
  'ListView'
);
const ConfigItemView = lazyRoute(
  () => import('@/react/docker/configs/ItemView/ItemView'),
  'ItemView'
);
const ConfigCreateView = lazyRoute(
  () => import('@/react/docker/configs/CreateView/CreateView'),
  'CreateView'
);
const DashboardView = lazyRoute(
  () => import('@/react/docker/DashboardView/DashboardView'),
  'DashboardView'
);
const EventsListView = lazyRoute(
  () => import('@/react/docker/events/ListView'),
  'ListView'
);
const ImagesListView = lazyRoute(
  () => import('@/react/docker/images/ListView/ListView'),
  'ListView'
);
const ImageImportView = lazyRoute(
  () => import('@/react/docker/images/ImportView/ImportView'),
  'ImportView'
);
const ImageItemView = lazyRoute(
  () => import('@/react/docker/images/ItemView/ItemView'),
  'ItemView'
);
const ImageBuildView = lazyRoute(
  () => import('@/react/docker/images/BuildView/BuildView'),
  'BuildView'
);
const SwarmView = lazyRoute(
  () => import('@/react/docker/swarm/SwarmView/SwarmView'),
  'SwarmView'
);
const SwarmVisualizerView = lazyRoute(
  () => import('@/react/docker/swarm/VisualizerView/VisualizerView'),
  'VisualizerView'
);
const FeaturesConfigurationView = lazyRoute(
  () =>
    import('@/react/docker/host/FeaturesConfigurationView/FeaturesConfigurationView'),
  'FeaturesConfigurationView'
);
const HostBrowseView = lazyRoute(
  () => import('@/react/docker/host/BrowseView/BrowseView'),
  'HostBrowseView'
);
const NodeBrowseView = lazyRoute(
  () => import('@/react/docker/host/BrowseView/BrowseView'),
  'NodeBrowseView'
);
const HostDetailsView = lazyRoute(
  () => import('@/react/docker/host/DetailsView/DetailsView'),
  'HostDetailsView'
);
const NodeDetailsView = lazyRoute(
  () => import('@/react/docker/host/DetailsView/DetailsView'),
  'NodeDetailsView'
);
const NetworkItemView = lazyRoute(
  () => import('@/react/docker/networks/ItemView'),
  'ItemView'
);
const NetworksListView = lazyRoute(
  () => import('@/react/docker/networks/ListView/ListView'),
  'ListView'
);
const NetworkCreateView = lazyRoute(
  () => import('@/react/docker/networks/CreateView/CreateView'),
  'CreateView'
);
const StackCreateView = lazyRoute(
  () => import('@/react/docker/stacks/CreateView/CreateView'),
  'CreateView'
);
const StackItemView = lazyRoute(
  () => import('@/react/docker/stacks/ItemView/ItemView'),
  'ItemView'
);
const StacksListView = lazyRoute(
  () => import('@/react/docker/stacks/ListView/ListView'),
  'ListView'
);
const RegistryAccessView = lazyRoute(
  () =>
    import('@/react/portainer/registries/environments/AccessView/RegistryAccessView'),
  'RegistryAccessView'
);
const ServiceLogsView = lazyRoute(
  () => import('@/react/docker/services/LogsView/LogsView'),
  'LogsView'
);
const ServicesListView = lazyRoute(
  () => import('@/react/docker/services/ListView/ListView'),
  'ListView'
);
const ServiceItemView = lazyRoute(
  () => import('@/react/docker/services/ItemView/ItemView'),
  'ItemView'
);
const ServiceCreateView = lazyRoute(
  () => import('@/react/docker/services/CreateView/CreateView'),
  'CreateView'
);
const TaskLogsView = lazyRoute(
  () => import('@/react/docker/tasks/LogsView/LogsView'),
  'LogsView'
);
const TaskItemView = lazyRoute(
  () => import('@/react/docker/tasks/ItemView/ItemView'),
  'ItemView'
);
const SecretsListView = lazyRoute(
  () => import('@/react/docker/secrets/ListView/ListView'),
  'ListView'
);
const SecretItemView = lazyRoute(
  () => import('@/react/docker/secrets/ItemView/ItemView'),
  'ItemView'
);
const SecretCreateView = lazyRoute(
  () => import('@/react/docker/secrets/CreateView/CreateView'),
  'CreateView'
);
const VolumesListView = lazyRoute(
  () => import('@/react/docker/volumes/ListView/ListView'),
  'ListView'
);
const VolumeItemView = lazyRoute(
  () => import('@/react/docker/volumes/ItemView/ItemView'),
  'ItemView'
);
const VolumeCreateView = lazyRoute(
  () => import('@/react/docker/volumes/CreateView/CreateView'),
  'CreateView'
);
const VolumeBrowseView = lazyRoute(
  () => import('@/react/docker/volumes/BrowseView/BrowseView'),
  'BrowseView'
);

export const ConfigsListRoute = withCurrentUser(ConfigsListView);
export const ConfigItemRoute = withCurrentUser(ConfigItemView);
export const ConfigCreateRoute = withCurrentUser(ConfigCreateView);
export const DockerDashboardRoute = withCurrentUser(DashboardView);
export const EventsListRoute = withCurrentUser(EventsListView);
export const ImagesListRoute = withCurrentUser(ImagesListView);
export const ImageImportRoute = withCurrentUser(ImageImportView);
export const ImageItemRoute = withCurrentUser(ImageItemView);
export const ImageBuildRoute = withCurrentUser(ImageBuildView);
export const HostBrowseRoute = withCurrentUser(HostBrowseView);
export const NodeBrowseRoute = withCurrentUser(NodeBrowseView);
export const HostDetailsRoute = withCurrentUser(HostDetailsView);
export const NodeDetailsRoute = withCurrentUser(NodeDetailsView);
export const SwarmRoute = withCurrentUser(SwarmView);
export const SwarmVisualizerRoute = withCurrentUser(SwarmVisualizerView);
export const DockerFeaturesConfigurationRoute = withCurrentUser(
  FeaturesConfigurationView
);
export const NetworkItemRoute = withCurrentUser(NetworkItemView);
export const NetworksListRoute = withCurrentUser(NetworksListView);
export const NetworkCreateRoute = withCurrentUser(NetworkCreateView);
export const StackCreateRoute = withCurrentUser(StackCreateView);
export const StackItemRoute = withCurrentUser(StackItemView);
export const StacksListRoute = withCurrentUser(StacksListView);
export const RegistryAccessRoute = withCurrentUser(RegistryAccessView);
export const ServiceLogsRoute = withCurrentUser(ServiceLogsView);
export const ServicesListRoute = withCurrentUser(ServicesListView);
export const ServiceItemRoute = withCurrentUser(ServiceItemView);
export const ServiceCreateRoute = withCurrentUser(ServiceCreateView);
export const TaskLogsRoute = withCurrentUser(TaskLogsView);
export const TaskItemRoute = withCurrentUser(TaskItemView);
export const SecretsListRoute = withCurrentUser(SecretsListView);
export const SecretItemRoute = withCurrentUser(SecretItemView);
export const SecretCreateRoute = withCurrentUser(SecretCreateView);
export const VolumesListRoute = withCurrentUser(VolumesListView);
export const VolumeItemRoute = withCurrentUser(VolumeItemView);
export const VolumeCreateRoute = withCurrentUser(VolumeCreateView);
export const VolumeBrowseRoute = withCurrentUser(VolumeBrowseView);
