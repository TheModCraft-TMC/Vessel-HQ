import {
  createRouteManifest,
  type RouteManifest,
} from '@/core/routing/route-contracts';

import { registerEdgeStates } from './register-states';

export const routeManifest: RouteManifest = createRouteManifest(
  'edge',
  registerEdgeStates
);
