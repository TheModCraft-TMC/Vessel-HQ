import { withCurrentUser } from '@/core/routing/guards/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazy-loading/lazyRoute';

const CreateUserAccessToken = lazyRoute(
  () => import('@/domains/users'),
  'CreateUserAccessToken'
);
const AccountView = lazyRoute(() => import('@/domains/users'), 'AccountView');
const CreateHelmRepositoriesView = lazyRoute(
  () => import('@/domains/users'),
  'CreateHelmRepositoriesView'
);
const EdgeAutoCreateScriptViewWrapper = lazyRoute(
  () => import('@/domains/edge'),
  'EdgeAutoCreateScriptViewWrapper'
);
const EnvironmentItemView = lazyRoute(
  () => import('@/domains/environments'),
  'EnvironmentItemView'
);
const EnvironmentAccessView = lazyRoute(
  () =>
    import('@/react/portainer/environments/AccessView/EnvironmentAccessView'),
  'EnvironmentAccessView'
);
const EnvironmentsListView = lazyRoute(
  () => import('@/react/portainer/environments/ListView'),
  'ListView'
);
const CreateGroupView = lazyRoute(
  () =>
    import('@/react/portainer/environments/environment-groups/CreateView/CreateGroupView'),
  'CreateGroupView'
);
const EditGroupView = lazyRoute(
  () =>
    import('@/react/portainer/environments/environment-groups/ItemView/EditGroupView'),
  'EditGroupView'
);
const EnvironmentGroupsListView = lazyRoute(
  () => import('@/react/portainer/environments/environment-groups/ListView'),
  'ListView'
);
const SourceCreateView = lazyRoute(
  () => import('@/domains/gitops'),
  'CreateSourceView'
);
const SourceItemView = lazyRoute(
  () => import('@/domains/gitops'),
  'SourceItemView'
);
const SourcesListView = lazyRoute(
  () => import('@/domains/gitops'),
  'SourcesListView'
);
const WorkflowItemView = lazyRoute(
  () => import('@/domains/gitops'),
  'WorkflowItemView'
);
const WorkflowsListView = lazyRoute(
  () => import('@/domains/gitops'),
  'WorkflowsListView'
);
const HomeView = lazyRoute(
  () => import('@/domains/environments'),
  'EnvironmentsHomeView'
);
const InitEdgeView = lazyRoute(
  () => import('@/react/portainer/init/InitEdgeView/InitEdgeView'),
  'InitEdgeView'
);
const InitAdminView = lazyRoute(
  () => import('@/react/portainer/init/InitAdminView/InitAdminView'),
  'InitAdminView'
);
const ActivityLogsView = lazyRoute(
  () => import('@/react/portainer/logs/ActivityLogsView/ActivityLogsView'),
  'ActivityLogsView'
);
const RegistriesListView = lazyRoute(
  () => import('@/domains/registries'),
  'RegistriesListView'
);
const RegistryCreateView = lazyRoute(
  () => import('@/domains/registries'),
  'RegistryCreateView'
);
const RegistryItemView = lazyRoute(
  () => import('@/domains/registries'),
  'RegistryItemView'
);
const EnvironmentRegistriesListView = lazyRoute(
  () => import('@/domains/registries'),
  'EnvironmentRegistriesListView'
);
const RepositoryView = lazyRoute(
  () => import('@/domains/registries'),
  'RepositoryView'
);
const RepositoriesView = lazyRoute(
  () => import('@/domains/registries'),
  'RepositoriesView'
);
const SettingsView = lazyRoute(
  () => import('@/domains/settings'),
  'SettingsView'
);
const EdgeComputeSettingsView = lazyRoute(
  () => import('@/domains/settings'),
  'EdgeComputeSettingsRoute'
);
const NotificationsView = lazyRoute(
  () => import('@/domains/notifications'),
  'NotificationsView'
);
const TagsView = lazyRoute(
  () => import('@/react/portainer/environments/TagsView/TagsView'),
  'TagsView'
);
const AppTemplatesView = lazyRoute(
  () => import('@/domains/templates'),
  'AppTemplatesView'
);
const CreateCustomTemplateView = lazyRoute(
  () => import('@/domains/templates'),
  'CreateCustomTemplateView'
);
const EditCustomTemplateView = lazyRoute(
  () => import('@/domains/templates'),
  'EditCustomTemplateView'
);
const CustomTemplatesListView = lazyRoute(
  () => import('@/domains/templates'),
  'CustomTemplatesListView'
);
const UsersListView = lazyRoute(
  () => import('@/domains/users'),
  'UsersListView'
);
const RolesView = lazyRoute(() => import('@/domains/users'), 'RolesView');
const UserView = lazyRoute(() => import('@/domains/users'), 'UserView');
const Sidebar = lazyRoute(() => import('@/ui/layouts/navigation'), 'Sidebar');
const AuthenticationView = lazyRoute(
  () => import('@/domains/settings'),
  'AuthenticationView'
);

// UI-Router React Hybrid supplies router context directly to these route
// components. The user wrapper also supplies the shared React Query client.
export const HomeRoute = withCurrentUser(HomeView);
export const AccountRoute = withCurrentUser(AccountView);
export const SidebarRoute = withCurrentUser(Sidebar);
export const CreateUserAccessTokenRoute = withCurrentUser(
  CreateUserAccessToken
);
export const CreateHelmRepositoryRoute = withCurrentUser(
  CreateHelmRepositoriesView
);
export const EnvironmentsListRoute = withCurrentUser(EnvironmentsListView);
export const EnvironmentItemRoute = withCurrentUser(EnvironmentItemView);
export const EnvironmentAccessRoute = withCurrentUser(EnvironmentAccessView);
export const EdgeAutoCreateScriptRoute = withCurrentUser(
  EdgeAutoCreateScriptViewWrapper
);
export const EnvironmentGroupsListRoute = withCurrentUser(
  EnvironmentGroupsListView
);
export const EnvironmentGroupEditRoute = withCurrentUser(EditGroupView);
export const EnvironmentGroupCreateRoute = withCurrentUser(CreateGroupView);
export const WorkflowsListRoute = withCurrentUser(WorkflowsListView);
export const WorkflowItemRoute = withCurrentUser(WorkflowItemView);
export const SourcesListRoute = withCurrentUser(SourcesListView);
export const SourceItemRoute = withCurrentUser(SourceItemView);
export const SourceCreateRoute = withCurrentUser(SourceCreateView);
export const InitEdgeRoute = withCurrentUser(InitEdgeView);
export const InitAdminRoute = InitAdminView;
export const SettingsRoute = withCurrentUser(SettingsView);
export const AuthenticationSettingsRoute = withCurrentUser(AuthenticationView);
export const EdgeComputeSettingsRoute = withCurrentUser(
  EdgeComputeSettingsView
);
export const NotificationsRoute = withCurrentUser(NotificationsView);
export const TagsRoute = withCurrentUser(TagsView);
export const UsersListRoute = withCurrentUser(UsersListView);
export const UserRoute = withCurrentUser(UserView);
export const RolesRoute = withCurrentUser(RolesView);
export const ActivityLogsRoute = withCurrentUser(ActivityLogsView);
export const RegistriesListRoute = withCurrentUser(RegistriesListView);
export const RegistryCreateRoute = withCurrentUser(RegistryCreateView);
export const RegistryItemRoute = withCurrentUser(RegistryItemView);
export const EnvironmentRegistriesListRoute = withCurrentUser(
  EnvironmentRegistriesListView
);
export const RegistryRepositoriesRoute = withCurrentUser(RepositoriesView);
export const RegistryRepositoryRoute = withCurrentUser(RepositoryView);
export const AppTemplatesRoute = withCurrentUser(AppTemplatesView);
export const CustomTemplatesListRoute = withCurrentUser(
  CustomTemplatesListView
);
export const CreateCustomTemplateRoute = withCurrentUser(
  CreateCustomTemplateView
);
export const EditCustomTemplateRoute = withCurrentUser(EditCustomTemplateView);
