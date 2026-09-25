import {
  createRouteManifest,
  type RouteManifest,
} from '@/core/routing/route-contracts';

import { registerAzureStates } from './register-states';

export const routeManifest: RouteManifest = createRouteManifest(
  'azure',
  registerAzureStates
);
