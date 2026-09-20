import { StateRegistry } from '@uirouter/react';

import { registerReactState } from '@/react-tools/registerReactState';

import {
  ContainerCreateRoute,
  ContainerAttachRoute,
  ContainerExecRoute,
  ContainerInspectRoute,
  ContainerItemRoute,
  ContainerLogsRoute,
  ContainersListRoute,
  ContainerStatsRoute,
} from './route-components';

export function registerContainerStates(
  $stateRegistryProvider: StateRegistry
) {
  registerReactState($stateRegistryProvider, {
    name: 'docker.containers',
    url: '/containers',
    views: {
      'content@': {
        component: ContainersListRoute,
      },
    },
    data: {
      docs: '/user/docker/containers',
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'docker.containers.container',
    url: '/:id?nodeName',
    views: {
      'content@': {
        component: ContainerItemRoute,
      },
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'docker.containers.container.attach',
    url: '/attach',
    views: {
      'content@': {
        component: ContainerAttachRoute,
      },
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'docker.containers.container.exec',
    url: '/exec',
    views: {
      'content@': {
        component: ContainerExecRoute,
      },
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'docker.containers.new',
    url: '/new?nodeName&from',
    views: {
      'content@': {
        component: ContainerCreateRoute,
      },
    },
    data: {
      docs: '/user/docker/containers/add',
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'docker.containers.container.inspect',
    url: '/inspect',
    views: {
      'content@': {
        component: ContainerInspectRoute,
      },
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'docker.containers.container.logs',
    url: '/logs',
    views: {
      'content@': {
        component: ContainerLogsRoute,
      },
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'docker.containers.container.stats',
    url: '/stats',
    views: {
      'content@': {
        component: ContainerStatsRoute,
      },
    },
  });
}
