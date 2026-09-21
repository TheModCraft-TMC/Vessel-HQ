import { StateRegistry } from '@uirouter/react';

import { registerReactState } from '@/core/routing/registerReactState';
import {
  EnvironmentCreationView,
  EnvironmentTypeSelectView,
  HomeView,
} from '@/react/portainer/environments/wizard';
import { withCurrentUser } from '@/core/routing/withCurrentUser';
import { AccessHeaders } from '@/portainer/authorization-guard';

const EnvironmentCreationRoute = withCurrentUser(EnvironmentCreationView);
const EnvironmentTypeSelectRoute = withCurrentUser(EnvironmentTypeSelectView);
const WizardHomeRoute = withCurrentUser(HomeView);

export function registerWizardStates($stateRegistryProvider: StateRegistry) {
  registerReactState($stateRegistryProvider, {
    name: 'portainer.wizard',
    url: '/wizard',
    views: {
      'content@': {
        component: WizardHomeRoute,
      },
    },
    data: {
      access: AccessHeaders.Admin,
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'portainer.wizard.endpoints',
    url: '/endpoints?referrer',
    views: {
      'content@': {
        component: EnvironmentTypeSelectRoute,
      },
    },
    params: {
      localEndpointId: 0,
    },
    data: {
      docs: '/admin/environments/add',
    },
  });

  registerReactState($stateRegistryProvider, {
    name: 'portainer.wizard.endpoints.create',
    url: '/create?envType&step',
    views: {
      'content@': {
        component: EnvironmentCreationRoute,
      },
    },
    params: {
      envType: '',
      step: { value: null, squash: true },
    },
  });
}
