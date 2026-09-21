import { StateRegistry } from '@uirouter/react';

import { registerReactState } from '@/core/routing/registerReactState';
import {
  ListView,
  CreateView,
  ItemView,
} from '@/react/portainer/environments/update-schedules';
import { withCurrentUser } from '@/core/routing/withCurrentUser';

const UpdateSchedulesListRoute = withCurrentUser(ListView);
const UpdateScheduleCreateRoute = withCurrentUser(CreateView);
const UpdateScheduleItemRoute = withCurrentUser(ItemView);

export function registerUpdateScheduleStates(
  $stateRegistryProvider: StateRegistry
) {
  registerReactState($stateRegistryProvider, {
    name: 'portainer.endpoints.updateSchedules',
    url: '/update-schedules',
    views: {
      'content@': {
        component: UpdateSchedulesListRoute,
      },
    },
    data: {
      docs: '/admin/environments/update',
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'portainer.endpoints.updateSchedules.create',
    url: '/update-schedules/new',
    views: {
      'content@': {
        component: UpdateScheduleCreateRoute,
      },
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'portainer.endpoints.updateSchedules.item',
    url: '/update-schedules/:id',
    views: {
      'content@': {
        component: UpdateScheduleItemRoute,
      },
    },
  });
}
