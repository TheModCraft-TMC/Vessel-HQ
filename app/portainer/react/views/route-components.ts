import { withCurrentUser } from '@/core/routing/withCurrentUser';
import { lazyRoute } from '@/core/routing/lazyRoute';

const CreateUserAccessToken = lazyRoute(
  () => import('@/react/portainer/account/CreateAccessTokenView'),
  'CreateUserAccessToken'
);
const AccountView = lazyRoute(
  () => import('@/react/portainer/account/AccountView/AccountView'),
  'AccountView'
);
const CreateHelmRepositoriesView = lazyRoute(
  () =>
    import('@/react/portainer/account/helm-repositories/CreateHelmRepositoryView'),
  'CreateHelmRepositoriesView'
);
const EdgeAutoCreateScriptViewWrapper = lazyRoute(
  () =>
    import('@/react/portainer/environments/EdgeAutoCreateScriptView/EdgeAutoCreateScriptView'),
  'EdgeAutoCreateScriptViewWrapper'
);
const EnvironmentItemView = lazyRoute(
  () => import('@/react/portainer/environments/ItemView/ItemView'),
  'ItemView'
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
  () => import('@/react/portainer/gitops/sources/CreateView/CreateView'),
  'CreateView'
);
const SourceItemView = lazyRoute(
  () => import('@/react/portainer/gitops/sources/ItemView/ItemView'),
  'ItemView'
);
const SourcesListView = lazyRoute(
  () => import('@/react/portainer/gitops/sources/ListView/ListView'),
  'ListView'
);
const WorkflowItemView = lazyRoute(
  () => import('@/react/portainer/gitops/workflows/ItemView/ItemView'),
  'ItemView'
);
const WorkflowsListView = lazyRoute(
  () => import('@/react/portainer/gitops/workflows/ListView/ListView'),
  'ListView'
);
const HomeView = lazyRoute(
  () => import('@/react/portainer/HomeView'),
  'HomeView'
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
  () => import('@/react/portainer/registries/ListView'),
  'ListView'
);
const RegistryCreateView = lazyRoute(
  () => import('@/react/portainer/registries/CreateView/CreateView'),
  'CreateView'
);
const RegistryItemView = lazyRoute(
  () => import('@/react/portainer/registries/ItemView/ItemView'),
  'ItemView'
);
const EnvironmentRegistriesListView = lazyRoute(
  () => import('@/react/portainer/registries/environments/ListView'),
  'ListView'
);
const RepositoryView = lazyRoute(
  () =>
    import('@/react/portainer/registries/repositories/ItemView/RepositoryView'),
  'RepositoryView'
);
const RepositoriesView = lazyRoute(
  () =>
    import('@/react/portainer/registries/repositories/ListView/RepositoriesView'),
  'RepositoriesView'
);
const SettingsView = lazyRoute(
  () => import('@/react/portainer/settings/SettingsView/SettingsView'),
  'SettingsView'
);
const EdgeComputeSettingsView = lazyRoute(
  () =>
    import('@/react/portainer/settings/EdgeComputeView/EdgeComputeSettingsView'),
  'EdgeComputeSettingsRoute'
);
const NotificationsView = lazyRoute(
  () => import('@/react/portainer/notifications/NotificationsView'),
  'NotificationsView'
);
const TagsView = lazyRoute(
  () => import('@/react/portainer/environments/TagsView/TagsView'),
  'TagsView'
);
const AppTemplatesView = lazyRoute(
  () => import('@/react/portainer/templates/app-templates/AppTemplatesView'),
  'AppTemplatesView'
);
const CreateCustomTemplateView = lazyRoute(
  () => import('@/react/portainer/templates/custom-templates/CreateView'),
  'CreateView'
);
const EditCustomTemplateView = lazyRoute(
  () => import('@/react/portainer/templates/custom-templates/EditView'),
  'EditView'
);
const CustomTemplatesListView = lazyRoute(
  () =>
    import('@/react/portainer/templates/custom-templates/ListView/ListView'),
  'ListView'
);
const UsersListView = lazyRoute(
  () => import('@/react/portainer/users/ListView/ListView'),
  'ListView'
);
const RolesView = lazyRoute(
  () => import('@/react/portainer/users/RolesView/RolesView'),
  'RolesView'
);
const UserView = lazyRoute(
  () => import('@/react/portainer/users/ItemView/UserView'),
  'UserView'
);
const Sidebar = lazyRoute(() => import('@/react/sidebar/Sidebar'), 'Sidebar');
const AuthenticationView = lazyRoute(
  () => import('@/react/portainer/settings/AuthenticationView'),
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
