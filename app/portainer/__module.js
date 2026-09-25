import { AccessHeaders } from '@/core/routing';
import { filterParam, paginationParams } from './helpers/stateParamHelper';
import { registerReactState } from '@/core/routing/registerReactState';
import { LoginRoute, LogoutRoute } from '@/domains/auth';
import {
  CreateHelmRepositoryRoute,
  AccountRoute,
  CreateUserAccessTokenRoute,
  EdgeAutoCreateScriptRoute,
  EnvironmentGroupCreateRoute,
  EnvironmentGroupEditRoute,
  EnvironmentGroupsListRoute,
  EnvironmentItemRoute,
  EnvironmentAccessRoute,
  EnvironmentsListRoute,
  HomeRoute,
  InitEdgeRoute,
  InitAdminRoute,
  EdgeComputeSettingsRoute,
  SettingsRoute,
  AuthenticationSettingsRoute,
  SidebarRoute,
  SourceCreateRoute,
  SourceItemRoute,
  SourcesListRoute,
  UsersListRoute,
  UserRoute,
  TagsRoute,
  WorkflowItemRoute,
  WorkflowsListRoute,
} from '@/core/routing/lazy-loading/route-components/portainer';

export function registerPortainerStates($stateRegistryProvider) {
  var root = {
    name: 'root',
    abstract: true,
    views: {
      'sidebar@': {
        component: SidebarRoute,
      },
    },
    data: {
      access: AccessHeaders.Restricted,
    },
  };

  var endpointRoot = {
    name: 'endpoint',
    url: '/:endpointId',
    parent: 'root',
    abstract: true,
  };

  var portainer = {
    name: 'portainer',
    parent: 'root',
    abstract: true,
  };

  var account = {
    name: 'portainer.account',
    url: '/account',
    views: {
      'content@': {
        component: AccountRoute,
      },
    },
    data: {
      docs: '/user/account-settings',
    },
  };

  const tokenCreation = {
    name: 'portainer.account.new-access-token',
    url: '/tokens/new',
    views: {
      'content@': {
        component: CreateUserAccessTokenRoute,
      },
    },
  };

  const createHelmRepository = {
    name: 'portainer.account.createHelmRepository',
    url: '/helm-repository/new',
    views: {
      'content@': {
        component: CreateHelmRepositoryRoute,
      },
    },
  };

  var authentication = {
    name: 'portainer.auth',
    url: '/auth',
    params: {
      reload: false,
    },
    views: {
      'content@': {
        component: LoginRoute,
      },
      'sidebar@': {},
    },
    data: {
      access: undefined,
    },
  };

  const logout = {
    name: 'portainer.logout',
    url: '/logout',
    params: {
      error: '',
    },
    views: {
      'content@': {
        component: LogoutRoute,
      },
      'sidebar@': {},
    },
    data: {
      access: undefined,
    },
  };

  var endpoints = {
    name: 'portainer.endpoints',
    url: '/endpoints',
    views: {
      'content@': {
        component: EnvironmentsListRoute,
      },
    },
    data: {
      docs: '/admin/environments/environments',
    },
  };

  var endpoint = {
    name: 'portainer.endpoints.endpoint',
    url: '/:id?redirectTo',
    params: {
      redirectTo: '',
    },
    views: {
      'content@': {
        component: EnvironmentItemRoute,
      },
    },
  };

  const edgeAutoCreateScript = {
    name: 'portainer.endpoints.edgeAutoCreateScript',
    url: '/aeec',
    views: {
      'content@': {
        component: EdgeAutoCreateScriptRoute,
      },
    },
    data: {
      docs: '/admin/environments/aeec',
    },
  };

  var endpointAccess = {
    name: 'portainer.endpoints.endpoint.access',
    url: '/access',
    views: {
      'content@': {
        component: EnvironmentAccessRoute,
      },
    },
  };

  var groups = {
    name: 'portainer.groups',
    url: '/groups',
    views: {
      'content@': {
        component: EnvironmentGroupsListRoute,
      },
    },
    data: {
      docs: '/admin/environments/groups',
      access: AccessHeaders.Admin,
    },
  };

  var group = {
    name: 'portainer.groups.group',
    url: '/:id?tab',
    views: {
      'content@': {
        component: EnvironmentGroupEditRoute,
      },
    },
    params: {
      id: {
        type: 'int',
      },
      tab: {
        dynamic: true,
      },
    },
  };

  var groupCreation = {
    name: 'portainer.groups.new',
    url: '/new',
    views: {
      'content@': {
        component: EnvironmentGroupCreateRoute,
      },
    },
  };

  var home = {
    name: 'portainer.home',
    url: '/home?redirect&environmentId&environmentName&route&groupBy&groupFilter&search&order',
    params: {
      ...paginationParams(),
      sort: filterParam(),
      order: filterParam(),
      groupBy: filterParam(),
      groupFilter: filterParam(),
    },
    views: {
      'content@': {
        component: HomeRoute,
      },
    },
    data: {
      docs: '/user/home',
    },
  };

  var gitopsBase = {
    name: 'portainer.gitops',
    url: '/gitops',
    abstract: true,
  };

  var workflows = {
    name: 'portainer.gitops.workflows',
    url: '/workflows?search&sort&order&page&pageSize&status&type&platform&groupBy&groupFilter',
    data: { docs: '/user/app-delivery/workflows' },
    params: {
      ...paginationParams(),
      sort: filterParam(),
      order: filterParam(),
      status: filterParam(),
      type: filterParam(),
      platform: filterParam(),
      groupBy: filterParam(),
      groupFilter: filterParam(),
    },
    views: {
      'content@': {
        component: WorkflowsListRoute,
      },
    },
  };

  var gitopsWorkflowDetail = {
    name: 'portainer.gitops.workflows.item',
    url: '/:workflowId',
    views: {
      'content@': {
        component: WorkflowItemRoute,
      },
    },
  };

  var gitopsSources = {
    name: 'portainer.gitops.sources',
    url: '/sources?search&sort&order&page&pageSize&status&type',
    data: { docs: '/user/app-delivery/sources' },
    params: {
      ...paginationParams(),
      sort: filterParam(),
      order: filterParam(),
      status: filterParam(),
      type: filterParam(),
    },
    views: {
      'content@': {
        component: SourcesListRoute,
      },
    },
  };

  var gitopsSourceDetail = {
    name: 'portainer.gitops.sources.item',
    url: '/:sourceId?tab',
    params: {
      tab: filterParam('settings'),
    },
    views: {
      'content@': {
        component: SourceItemRoute,
      },
    },
  };

  const gitopsSourceCreate = {
    name: 'portainer.gitops.sources.new',
    url: '/new',
    views: {
      'content@': {
        component: SourceCreateRoute,
      },
    },
  };

  var init = {
    name: 'portainer.init',
    abstract: true,
    url: '/init',
    views: {
      'sidebar@': {},
    },
    data: {
      access: undefined,
    },
  };

  var initAdmin = {
    name: 'portainer.init.admin',
    url: '/admin',
    views: {
      'content@': {
        component: InitAdminRoute,
      },
    },
  };

  const initEdge = {
    name: 'portainer.init.edge',
    url: '/edge',
    views: {
      'content@': {
        component: InitEdgeRoute,
      },
    },
  };

  var settings = {
    name: 'portainer.settings',
    url: '/settings',
    views: {
      'content@': {
        component: SettingsRoute,
      },
    },
    data: {
      docs: '/admin/settings',
      access: AccessHeaders.Admin,
    },
  };

  var settingsAuthentication = {
    name: 'portainer.settings.authentication',
    url: '/auth',
    views: {
      'content@': { component: AuthenticationSettingsRoute },
    },
    data: {
      docs: '/admin/settings/authentication',
    },
  };

  var settingsEdgeCompute = {
    name: 'portainer.settings.edgeCompute',
    url: '/edge',
    views: {
      'content@': {
        component: EdgeComputeSettingsRoute,
      },
    },
    data: {
      docs: '/admin/settings/edge',
    },
  };

  var tags = {
    name: 'portainer.tags',
    url: '/tags',
    views: {
      'content@': {
        component: TagsRoute,
      },
    },
    data: {
      docs: '/admin/environments/tags',
      access: AccessHeaders.Admin,
    },
  };

  var users = {
    name: 'portainer.users',
    url: '/users',
    views: {
      'content@': {
        component: UsersListRoute,
      },
    },
    data: {
      docs: '/admin/user/users',
      access: AccessHeaders.Restricted, // allow for team leaders
    },
  };

  var user = {
    name: 'portainer.users.user',
    url: '/:id',
    views: {
      'content@': {
        component: UserRoute,
      },
    },
  };

  registerReactState($stateRegistryProvider, root);
  registerReactState($stateRegistryProvider, endpointRoot);
  registerReactState($stateRegistryProvider, portainer);
  registerReactState($stateRegistryProvider, account);
  registerReactState($stateRegistryProvider, tokenCreation);
  registerReactState($stateRegistryProvider, authentication);
  registerReactState($stateRegistryProvider, logout);
  registerReactState($stateRegistryProvider, endpoints);
  registerReactState($stateRegistryProvider, endpoint);
  registerReactState($stateRegistryProvider, endpointAccess);
  registerReactState($stateRegistryProvider, edgeAutoCreateScript);
  registerReactState($stateRegistryProvider, groups);
  registerReactState($stateRegistryProvider, group);
  registerReactState($stateRegistryProvider, groupCreation);
  registerReactState($stateRegistryProvider, home);
  registerReactState($stateRegistryProvider, gitopsBase);
  registerReactState($stateRegistryProvider, workflows);
  registerReactState($stateRegistryProvider, gitopsWorkflowDetail);
  registerReactState($stateRegistryProvider, gitopsSources);
  registerReactState($stateRegistryProvider, gitopsSourceDetail);
  registerReactState($stateRegistryProvider, gitopsSourceCreate);
  registerReactState($stateRegistryProvider, init);
  registerReactState($stateRegistryProvider, initAdmin);
  registerReactState($stateRegistryProvider, initEdge);
  registerReactState($stateRegistryProvider, settings);
  registerReactState($stateRegistryProvider, settingsAuthentication);
  registerReactState($stateRegistryProvider, settingsEdgeCompute);
  registerReactState($stateRegistryProvider, tags);
  registerReactState($stateRegistryProvider, users);
  registerReactState($stateRegistryProvider, user);
  registerReactState($stateRegistryProvider, createHelmRepository);
}
