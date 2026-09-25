import { AccessHeaders } from '@/core/routing';
import { registerReactState } from '@/core/routing/registerReactState';
import { RolesRoute } from '@/core/routing/lazy-loading/route-components/portainer';

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
