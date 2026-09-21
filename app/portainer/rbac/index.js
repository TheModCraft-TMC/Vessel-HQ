import { AccessHeaders } from '../authorization-guard';
import { registerReactState } from '@/core/routing/registerReactState';
import { RolesRoute } from '@/portainer/react/views/route-components';

export function registerRbacStates($stateRegistryProvider) {
  const roles = {
    name: 'portainer.roles',
    url: '/roles',
    views: {
      'content@': {
        component: RolesRoute,
      },
    },
    data: {
      docs: '/admin/user/roles',
      access: AccessHeaders.Admin,
    },
  };

  registerReactState($stateRegistryProvider, roles);
}
