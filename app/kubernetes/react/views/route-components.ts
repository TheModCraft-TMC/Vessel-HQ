import { withCurrentUser } from '@/core/routing/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazyRoute';

const ConsoleView = lazyRoute(
  () => import('@/react/kubernetes/applications/ConsoleView'),
  'ConsoleView'
);
const ApplicationDetailsView = lazyRoute(
  () =>
    import('@/react/kubernetes/applications/DetailsView/ApplicationDetailsView'),
  'ApplicationDetailsView'
);
const ApplicationsView = lazyRoute(
  () => import('@/react/kubernetes/applications/ListView/ApplicationsView'),
  'ApplicationsView'
);
const ClusterView = lazyRoute(
  () => import('@/react/kubernetes/cluster/ClusterView'),
  'ClusterView'
);
const ConfigureView = lazyRoute(
  () => import('@/react/kubernetes/cluster/ConfigureView'),
  'ConfigureView'
);
const KubectlShellView = lazyRoute(
  () => import('@/react/kubernetes/cluster/KubectlShell/KubectlShellView'),
  'KubectlShellView'
);
const NodeView = lazyRoute(
  () => import('@/react/kubernetes/cluster/NodeView/NodeView'),
  'NodeView'
);
const NodeStatsView = lazyRoute(
  () => import('@/react/kubernetes/cluster/NodeStatsView/NodeStatsView'),
  'NodeStatsView'
);
const ApplicationStatsView = lazyRoute(
  () =>
    import('@/react/kubernetes/applications/StatsView/ApplicationStatsView'),
  'ApplicationStatsView'
);
const KubernetesLogsView = lazyRoute(
  () => import('@/react/kubernetes/applications/LogsView'),
  'KubernetesLogsView'
);
const ConfigmapsAndSecretsView = lazyRoute(
  () => import('@/react/kubernetes/configs/ListView/ConfigmapsAndSecretsView'),
  'ConfigmapsAndSecretsView'
);
const ResourceEditorView = lazyRoute(
  () => import('@/react/kubernetes/configs/ResourceEditorView'),
  'ResourceEditorView'
);
const DashboardView = lazyRoute(
  () => import('@/react/kubernetes/dashboard/DashboardView'),
  'DashboardView'
);
const HelmApplicationView = lazyRoute(
  () => import('@/react/kubernetes/helm/HelmApplicationView'),
  'HelmApplicationView'
);
const HelmInstallView = lazyRoute(
  () => import('@/react/kubernetes/helm/install/HelmInstallView'),
  'HelmInstallView'
);
const CreateIngressView = lazyRoute(
  () => import('@/react/kubernetes/ingresses/CreateIngressView'),
  'CreateIngressView'
);
const IngressesDatatableView = lazyRoute(
  () => import('@/react/kubernetes/ingresses/IngressDatatable'),
  'IngressesDatatableView'
);
const ClusterRolesView = lazyRoute(
  () => import('@/react/kubernetes/more-resources/ClusterRolesView'),
  'ClusterRolesView'
);
const JobsView = lazyRoute(
  () => import('@/react/kubernetes/more-resources/JobsView/JobsView'),
  'JobsView'
);
const ResourceDetailsYAMLView = lazyRoute(
  () => import('@/react/kubernetes/more-resources/ResourceDetailsYAMLView'),
  'ResourceDetailsYAMLView'
);
const RolesView = lazyRoute(
  () => import('@/react/kubernetes/more-resources/RolesView'),
  'RolesView'
);
const ServiceAccountView = lazyRoute(
  () =>
    import('@/react/kubernetes/more-resources/ServiceAccountsView/ItemView/ServiceAccountView'),
  'ServiceAccountView'
);
const ServiceAccountsView = lazyRoute(
  () =>
    import('@/react/kubernetes/more-resources/ServiceAccountsView/ServiceAccountsView'),
  'ServiceAccountsView'
);
const AccessView = lazyRoute(
  () => import('@/react/kubernetes/namespaces/AccessView/AccessView'),
  'AccessView'
);
const CreateNamespaceView = lazyRoute(
  () => import('@/react/kubernetes/namespaces/CreateView/CreateNamespaceView'),
  'CreateNamespaceView'
);
const NamespaceView = lazyRoute(
  () => import('@/react/kubernetes/namespaces/ItemView/NamespaceView'),
  'NamespaceView'
);
const NamespacesView = lazyRoute(
  () => import('@/react/kubernetes/namespaces/ListView/NamespacesView'),
  'NamespacesView'
);
const ServicesView = lazyRoute(
  () => import('@/react/kubernetes/services/ServicesView'),
  'ServicesView'
);
const VolumesView = lazyRoute(
  () => import('@/react/kubernetes/volumes/ListView/VolumesView'),
  'VolumesView'
);
const RegistryAccessView = lazyRoute(
  () =>
    import('@/react/kubernetes/cluster/RegistryAccessView/RegistryAccessView'),
  'RegistryAccessView'
);
const DeployView = lazyRoute(
  () => import('@/react/kubernetes/DeployView'),
  'DeployView'
);
const ApplicationCreateView = lazyRoute(
  () => import('@/react/kubernetes/applications/ApplicationEditorView'),
  'ApplicationCreateView'
);
const ApplicationEditView = lazyRoute(
  () => import('@/react/kubernetes/applications/ApplicationEditorView'),
  'ApplicationEditView'
);

export const KubernetesConsoleRoute = withCurrentUser(ConsoleView);
export const ApplicationDetailsRoute = withCurrentUser(ApplicationDetailsView);
export const ApplicationsListRoute = withCurrentUser(ApplicationsView);
export const KubernetesClusterRoute = withCurrentUser(ClusterView);
export const KubernetesConfigureRoute = withCurrentUser(ConfigureView);
export const KubectlShellRoute = withCurrentUser(KubectlShellView);
export const KubernetesNodeRoute = withCurrentUser(NodeView);
export const KubernetesNodeStatsRoute = withCurrentUser(NodeStatsView);
export const ApplicationStatsRoute = withCurrentUser(ApplicationStatsView);
export const KubernetesLogsRoute = withCurrentUser(KubernetesLogsView);
export const ConfigmapsAndSecretsRoute = withCurrentUser(
  ConfigmapsAndSecretsView
);
export const KubernetesResourceEditorRoute =
  withCurrentUser(ResourceEditorView);
export const KubernetesDashboardRoute = withCurrentUser(DashboardView);
export const HelmApplicationRoute = withCurrentUser(HelmApplicationView);
export const HelmInstallRoute = withCurrentUser(HelmInstallView);
export const IngressCreateRoute = withCurrentUser(CreateIngressView);
export const IngressesListRoute = withCurrentUser(IngressesDatatableView);
export const ClusterRolesRoute = withCurrentUser(ClusterRolesView);
export const JobsRoute = withCurrentUser(JobsView);
export const ResourceDetailsYAMLRoute = withCurrentUser(
  ResourceDetailsYAMLView
);
export const RolesRoute = withCurrentUser(RolesView);
export const ServiceAccountRoute = withCurrentUser(ServiceAccountView);
export const ServiceAccountsRoute = withCurrentUser(ServiceAccountsView);
export const NamespaceAccessRoute = withCurrentUser(AccessView);
export const NamespaceCreateRoute = withCurrentUser(CreateNamespaceView);
export const NamespaceRoute = withCurrentUser(NamespaceView);
export const NamespacesListRoute = withCurrentUser(NamespacesView);
export const ServicesRoute = withCurrentUser(ServicesView);
export const VolumesRoute = withCurrentUser(VolumesView);
export const KubernetesRegistryAccessRoute =
  withCurrentUser(RegistryAccessView);
export const KubernetesDeployRoute = withCurrentUser(DeployView);
export const ApplicationCreateRoute = withCurrentUser(ApplicationCreateView);
export const ApplicationEditRoute = withCurrentUser(ApplicationEditView);
