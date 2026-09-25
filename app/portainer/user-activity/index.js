import { registerReactState } from '@/core/routing/registerReactState';
import { AccessHeaders } from '@/core/routing';
import {
  ActivityLogsRoute,
  NotificationsRoute,
} from '@/core/routing/lazy-loading/route-components/portainer';

export function registerUserActivityStates($stateRegistryProvider) {
  registerReactState($stateRegistryProvider, {
    name: 'portainer.activityLogs',
    url: '/activity-logs',
    views: {
      'content@': {
        component: ActivityLogsRoute,
      },
    },
    data: {
      docs: '/admin/logs/activity',
      access: AccessHeaders.Admin,
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'portainer.notifications',
    url: '/notifications',
    views: {
      'content@': {
        component: NotificationsRoute,
      },
    },
    params: {
      id: '',
    },
    data: {
      docs: '/admin/notifications',
    },
  });
}
