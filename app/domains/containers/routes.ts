import { lazyRoute } from '@/core/routing';
import { registerReactState } from '@/core/routing/registerReactState';
import type { RouteRegistry } from '@/core/routing/route-contracts';
import { withCurrentUser } from '@/core/routing';

const ContainerCreateRoute = withCurrentUser(
  lazyRoute(() => import('./views/ContainerCreateView'), 'CreateView')
);
const ContainerInspectRoute = withCurrentUser(
  lazyRoute(
    () => import('./views/ContainerInspectView/InspectView'),
    'InspectView'
  )
);
export const ContainerItemRoute = withCurrentUser(
  lazyRoute(
    () => import('./views/ContainerDetailsView/ContainerDetailsView'),
    'ContainerDetailsView'
  )
);
const ContainersListRoute = withCurrentUser(
  lazyRoute(() => import('./views/ContainersListView'), 'ContainersListView')
);
const ContainerStatsRoute = withCurrentUser(
  lazyRoute(() => import('./views/ContainerStatsView/StatsView'), 'StatsView')
);
const ContainerLogsRoute = withCurrentUser(
  lazyRoute(() => import('./views/ContainerLogsView/LogView'), 'LogView')
);
const ContainerAttachRoute = withCurrentUser(
  lazyRoute(
    () => import('./views/ContainerConsoleView/ConsoleView'),
    'AttachConsoleView'
  )
);
const ContainerExecRoute = withCurrentUser(
  lazyRoute(
    () => import('./views/ContainerConsoleView/ConsoleView'),
    'ExecConsoleView'
  )
);

export function registerContainerStates(registry: RouteRegistry) {
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
