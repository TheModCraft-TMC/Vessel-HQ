import { StateRegistry } from '@uirouter/react';

import { lazyRoute } from '@/core/routing/lazyRoute';
import { registerReactState } from '@/core/routing/registerReactState';
import { withCurrentUser } from '@/core/routing/withCurrentUser';

const ContainerCreateRoute = withCurrentUser(
  lazyRoute(() => import('./CreateView'), 'CreateView')
);
const ContainerInspectRoute = withCurrentUser(
  lazyRoute(() => import('./InspectView/InspectView'), 'InspectView')
);
export const ContainerItemRoute = withCurrentUser(
  lazyRoute(() => import('./ItemView/ItemView'), 'ItemView')
);
const ContainersListRoute = withCurrentUser(
  lazyRoute(() => import('./ListView'), 'ListView')
);
const ContainerStatsRoute = withCurrentUser(
  lazyRoute(() => import('./StatsView/StatsView'), 'StatsView')
);
const ContainerLogsRoute = withCurrentUser(
  lazyRoute(() => import('./LogView/LogView'), 'LogView')
);
const ContainerAttachRoute = withCurrentUser(
  lazyRoute(() => import('./ConsoleView/ConsoleView'), 'AttachConsoleView')
);
const ContainerExecRoute = withCurrentUser(
  lazyRoute(() => import('./ConsoleView/ConsoleView'), 'ExecConsoleView')
);

export function registerContainerStates(registry: StateRegistry) {
  registerReactState(registry, {
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

  registerReactState(registry, {
    name: 'docker.containers.container',
    url: '/:id?nodeName',
    views: {
      'content@': {
        component: ContainerItemRoute,
      },
    },
  });

  registerReactState(registry, {
    name: 'docker.containers.container.attach',
    url: '/attach',
    views: {
      'content@': {
        component: ContainerAttachRoute,
      },
    },
  });

  registerReactState(registry, {
    name: 'docker.containers.container.exec',
    url: '/exec',
    views: {
      'content@': {
        component: ContainerExecRoute,
      },
    },
  });

  registerReactState(registry, {
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

  registerReactState(registry, {
    name: 'docker.containers.container.inspect',
    url: '/inspect',
    views: {
      'content@': {
        component: ContainerInspectRoute,
      },
    },
  });

  registerReactState(registry, {
    name: 'docker.containers.container.logs',
    url: '/logs',
    views: {
      'content@': {
        component: ContainerLogsRoute,
      },
    },
  });

  registerReactState(registry, {
    name: 'docker.containers.container.stats',
    url: '/stats',
    views: {
      'content@': {
        component: ContainerStatsRoute,
      },
    },
  });
}
