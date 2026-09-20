import { registerReactState } from '@/react-tools/registerReactState';
import { AccessHeaders } from '../authorization-guard';
import {
  ActivityLogsRoute,
  NotificationsRoute,
} from '../react/views/route-components';

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
