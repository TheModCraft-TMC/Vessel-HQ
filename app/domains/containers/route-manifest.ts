import {
  createRouteManifest,
  type RouteManifest,
} from '@/core/routing/route-contracts';

import { registerContainerStates } from './routes';

export const routeManifest: RouteManifest = createRouteManifest(
  'containers',
  registerContainerStates
);
