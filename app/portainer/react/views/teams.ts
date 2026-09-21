import { StateRegistry } from '@uirouter/react';

import { registerReactState } from '@/core/routing/registerReactState';
import { ItemView, ListView } from '@/react/portainer/users/teams';
import { withCurrentUser } from '@/core/routing/withCurrentUser';
import { AccessHeaders } from '@/portainer/authorization-guard';

const TeamItemRoute = withCurrentUser(ItemView);
const TeamsListRoute = withCurrentUser(ListView);

export function registerTeamStates($stateRegistryProvider: StateRegistry) {
  registerReactState($stateRegistryProvider, {
    name: 'portainer.teams',
    url: '/teams',
    views: {
      'content@': {
        component: TeamsListRoute,
      },
    },
    data: {
      docs: '/admin/user/teams',
      access: AccessHeaders.Restricted, // allow for team leaders
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'portainer.teams.team',
    url: '/:id',
    views: {
      'content@': {
        component: TeamItemRoute,
      },
    },
  });
}
