import { Transition, TransitionService } from '@uirouter/react';

import { queryClient } from '@/core/query';
import { startRealtimeQuerySync } from '@/core/realtime/query-sync';
import { applyTheme } from '@/core/theme/applyTheme';
import { storeReturnUrl } from '@/react/portainer/helpers/returnUrl';
import { hasAuthorizations } from '@/react/hooks/useUser';
import {
  getAuthenticatedUser,
  initializeAuthentication,
  isAdministrator,
  isEdgeAdministrator,
} from '@/core/session';

export enum AccessHeaders {
  Restricted = 'restricted',
  Admin = 'admin',
  EdgeAdmin = 'edge-admin',
}

type Authorizations = string[];
type Access =
  | AccessHeaders.Restricted
  | AccessHeaders.Admin
  | AccessHeaders.EdgeAdmin
  | Authorizations;

export function requiresAuthHook(transitionService: TransitionService) {
  transitionService.onBefore({}, checkAuthorizations);
}

// exported for tests
export async function checkAuthorizations(
  transition: Transition,
  checkUserAuthorizations = hasAuthorizations
) {
  const stateTo = transition.to();
  const $state = transition.router.stateService;

  const { access } = stateTo.data || {};
  if (!isAccess(access)) {
    return undefined;
  }

  const isLoggedIn = await initializeAuthentication();

  if (!isLoggedIn) {
    // eslint-disable-next-line no-console
    console.info(
      'User is not authenticated, redirecting to login, access:',
      access
    );
    const currentUrl =
      window.location.pathname + window.location.search + window.location.hash;
    storeReturnUrl(currentUrl);
    return $state.target('portainer.logout');
  }

  startRealtimeQuerySync(queryClient);
  const authenticatedUser = getAuthenticatedUser();
  if (authenticatedUser && typeof window.matchMedia === 'function') {
    applyTheme(authenticatedUser.ThemeSettings?.color || 'auto');
  }

  if (typeof access === 'string') {
    if (access === 'restricted') {
      return undefined;
    }

    if (access === 'admin') {
      if (isAdministrator()) {
        return undefined;
      }

      // eslint-disable-next-line no-console
      console.info(
        'User is not an admin, redirecting to home, access:',
        access
      );
      return $state.target('portainer.home');
    }

    if (access === 'edge-admin') {
      if (isEdgeAdministrator()) {
        return undefined;
      }

      // eslint-disable-next-line no-console
      console.info(
        'User is not an edge admin, redirecting to home, access:',
        access
      );
      return $state.target('portainer.home');
    }
  }

  const user = authenticatedUser;
  const endpointId = Number(transition.params().endpointId) || undefined;
  if (
    access.length > 0 &&
    (!user ||
      !checkUserAuthorizations(
        user as Parameters<typeof hasAuthorizations>[0],
        access,
        endpointId
      ))
  ) {
    // eslint-disable-next-line no-console
    console.info(
      'User does not have the required authorizations, redirecting to home'
    );
    return $state.target('portainer.home');
  }

  return undefined;
}

function isAccess(access: unknown): access is Access {
  if (!access || (typeof access !== 'string' && !Array.isArray(access))) {
    return false;
  }

  if (Array.isArray(access)) {
    return access.every((a) => typeof a === 'string');
  }

  return ['restricted', 'admin', 'edge-admin'].includes(access);
}
