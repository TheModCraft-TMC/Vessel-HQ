import { withCurrentUser } from '@/core/routing/guards/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazy-loading/lazyRoute';

const ConsoleView = lazyRoute(
  () => import('@/domains/applications'),
  'ConsoleView'
);
const ApplicationDetailsView = lazyRoute(
  () => import('@/domains/applications'),
  'ApplicationDetailsView'
);
const ApplicationsView = lazyRoute(
  () => import('@/domains/applications'),
  'ApplicationsView'
);
const ClusterView = lazyRoute(
  () => import('@/domains/clusters'),
  'ClusterView'
);
const ConfigureView = lazyRoute(
  () => import('@/domains/clusters'),
  'ConfigureView'
);
const KubectlShellView = lazyRoute(
  () => import('@/domains/clusters'),
  'KubectlShellView'
);
const NodeView = lazyRoute(() => import('@/domains/clusters'), 'NodeView');
const NodeStatsView = lazyRoute(
  () => import('@/domains/clusters'),
  'NodeStatsView'
);
const ApplicationStatsView = lazyRoute(
  () => import('@/domains/applications'),
  'ApplicationStatsView'
);
const KubernetesLogsView = lazyRoute(
  () => import('@/domains/applications'),
  'KubernetesLogsView'
);
const ConfigmapsAndSecretsView = lazyRoute(
  () => import('@/domains/configuration'),
  'ConfigmapsAndSecretsView'
);
const ResourceEditorView = lazyRoute(
  () => import('@/domains/configuration'),
  'ResourceEditorView'
);
const DashboardView = lazyRoute(
  () => import('@/domains/clusters'),
  'DashboardView'
);
const HelmApplicationView = lazyRoute(
  () => import('@/domains/configuration'),
  'HelmApplicationView'
);
const HelmInstallView = lazyRoute(
  () => import('@/domains/configuration'),
  'HelmInstallView'
);
const CreateIngressView = lazyRoute(
  () => import('@/domains/ingress'),
  'CreateIngressView'
);
const IngressesDatatableView = lazyRoute(
  () => import('@/domains/ingress'),
  'IngressesDatatableView'
);
const ClusterRolesView = lazyRoute(
  () => import('@/domains/kubernetes-access'),
  'ClusterRolesView'
);
const JobsView = lazyRoute(
  () => import('@/domains/kubernetes-access'),
  'JobsView'
);
const ResourceDetailsYAMLView = lazyRoute(
  () => import('@/domains/kubernetes-access'),
  'ResourceDetailsYAMLView'
);
const RolesView = lazyRoute(
  () => import('@/domains/kubernetes-access'),
  'RolesView'
);
const ServiceAccountView = lazyRoute(
  () => import('@/domains/kubernetes-access'),
  'ServiceAccountView'
);
const ServiceAccountsView = lazyRoute(
  () => import('@/domains/kubernetes-access'),
  'ServiceAccountsView'
);
const AccessView = lazyRoute(
  () => import('@/domains/namespaces'),
  'AccessView'
);
const CreateNamespaceView = lazyRoute(
  () => import('@/domains/namespaces'),
  'CreateNamespaceView'
);
const NamespaceView = lazyRoute(
  () => import('@/domains/namespaces'),
  'NamespaceView'
);
const NamespacesView = lazyRoute(
  () => import('@/domains/namespaces'),
  'NamespacesView'
);
const ServicesView = lazyRoute(
  () => import('@/domains/configuration'),
  'ServicesView'
);
const VolumesView = lazyRoute(
  () => import('@/domains/configuration'),
  'VolumesView'
);
const RegistryAccessView = lazyRoute(
  () => import('@/domains/clusters'),
  'RegistryAccessView'
);
const DeployView = lazyRoute(
  () => import('@/domains/applications'),
  'DeployView'
);
const ApplicationCreateView = lazyRoute(
  () => import('@/domains/applications'),
  'ApplicationCreateView'
);
const ApplicationEditView = lazyRoute(
  () => import('@/domains/applications'),
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
