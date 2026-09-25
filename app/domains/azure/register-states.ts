import type { RouteRegistry } from '@/core/routing/route-contracts';
import { registerReactState } from '@/core/routing/registerReactState';

import {
  AzureDashboardRoute,
  ContainerInstanceCreateRoute,
  ContainerInstanceRoute,
  ContainerInstancesListRoute,
} from './routes';

export function registerAzureStates($stateRegistryProvider: RouteRegistry) {
  const azure = {
    name: 'azure',
    url: '/azure',
    parent: 'endpoint',
    abstract: true,
  };

  const containerInstances = {
    name: 'azure.containerinstances',
    url: '/containerinstances',
    views: {
      'content@': {
        component: ContainerInstancesListRoute,
      },
    },
    data: {
      docs: '/user/aci/containers',
    },
  };

  const containerInstance = {
    name: 'azure.containerinstances.container',
    url: '/:id',
    views: {
      'content@': {
        component: ContainerInstanceRoute,
      },
    },
  };

  const containerInstanceCreation = {
    name: 'azure.containerinstances.new',
    url: '/new/',
    views: {
      'content@': {
        component: ContainerInstanceCreateRoute,
      },
    },
  };

  const dashboard = {
    name: 'azure.dashboard',
    url: '/dashboard',
    views: {
      'content@': {
        component: AzureDashboardRoute,
      },
    },
    data: {
      docs: '/user/aci/dashboard',
    },
  };

  registerReactState($stateRegistryProvider, azure);
  registerReactState($stateRegistryProvider, containerInstances);
  registerReactState($stateRegistryProvider, containerInstance);
  registerReactState($stateRegistryProvider, containerInstanceCreation);
  registerReactState($stateRegistryProvider, dashboard);
}
