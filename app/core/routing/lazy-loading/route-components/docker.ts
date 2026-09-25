import { withCurrentUser } from '@/core/routing/guards/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazy-loading/lazyRoute';

const ConfigsListView = lazyRoute(
  () => import('@/domains/services'),
  'ConfigsListView'
);
const ConfigItemView = lazyRoute(
  () => import('@/domains/services'),
  'ConfigItemView'
);
const ConfigCreateView = lazyRoute(
  () => import('@/domains/services'),
  'ConfigCreateView'
);
const DashboardView = lazyRoute(
  () => import('@/react/docker/DashboardView/DashboardView'),
  'DashboardView'
);
const EventsListView = lazyRoute(
  () => import('@/react/docker/events/ListView'),
  'ListView'
);
const ImagesListView = lazyRoute(() => import('@/domains/images'), 'ListView');
const ImageImportView = lazyRoute(
  () => import('@/domains/images'),
  'ImportView'
);
const ImageItemView = lazyRoute(() => import('@/domains/images'), 'ItemView');
const ImageBuildView = lazyRoute(() => import('@/domains/images'), 'BuildView');
const SwarmView = lazyRoute(() => import('@/domains/swarm'), 'SwarmView');
const SwarmVisualizerView = lazyRoute(
  () => import('@/domains/swarm'),
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
  () => import('@/domains/networks'),
  'ItemView'
);
const NetworksListView = lazyRoute(
  () => import('@/domains/networks'),
  'ListView'
);
const NetworkCreateView = lazyRoute(
  () => import('@/domains/networks'),
  'CreateView'
);
const StackCreateView = lazyRoute(
  () => import('@/domains/stacks'),
  'StackCreateView'
);
const StackItemView = lazyRoute(
  () => import('@/domains/stacks'),
  'StackItemView'
);
const StacksListView = lazyRoute(
  () => import('@/domains/stacks'),
  'StacksListView'
);
const RegistryAccessView = lazyRoute(
  () => import('@/domains/registries'),
  'RegistryAccessView'
);
const ServiceLogsView = lazyRoute(
  () => import('@/domains/services'),
  'ServiceLogsView'
);
const ServicesListView = lazyRoute(
  () => import('@/domains/services'),
  'ServicesListView'
);
const ServiceItemView = lazyRoute(
  () => import('@/domains/services'),
  'ServiceItemView'
);
const ServiceCreateView = lazyRoute(
  () => import('@/domains/services'),
  'ServiceCreateView'
);
const TaskLogsView = lazyRoute(
  () => import('@/domains/services'),
  'TaskLogsView'
);
const TaskItemView = lazyRoute(
  () => import('@/domains/services'),
  'TaskItemView'
);
const SecretsListView = lazyRoute(
  () => import('@/domains/services'),
  'SecretsListView'
);
const SecretItemView = lazyRoute(
  () => import('@/domains/services'),
  'SecretItemView'
);
const SecretCreateView = lazyRoute(
  () => import('@/domains/services'),
  'SecretCreateView'
);
const VolumesListView = lazyRoute(
  () => import('@/domains/volumes'),
  'ListView'
);
const VolumeItemView = lazyRoute(() => import('@/domains/volumes'), 'ItemView');
const VolumeCreateView = lazyRoute(
  () => import('@/domains/volumes'),
  'CreateView'
);
const VolumeBrowseView = lazyRoute(
  () => import('@/domains/volumes'),
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
