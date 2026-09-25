import {
  UIRouterReact,
  hashLocationPlugin,
  servicesPlugin,
} from '@uirouter/react';

import { requiresAuthHook } from '@/core/routing';
import { registerRouteManifests } from '@/core/routing/registry';
import { domainRouteManifests } from '@/core/routing/registry/domain-manifests';
import { resetAgentHeaders } from '@/portainer/services/http-request.helper';
import { registerTransitionHandlers } from '@/core/routing';

export const router = new UIRouterReact();

router.plugin(servicesPlugin);
router.plugin(hashLocationPlugin);
router.urlService.config.hashPrefix('!');

const registry = router.stateRegistry;
registerRouteManifests(registry, domainRouteManifests);

requiresAuthHook(router.transitionService);
registerTransitionHandlers(router.transitionService, {
  onBefore: resetAgentHeaders,
});

router.urlService.rules.initial({ state: 'portainer.auth' });
router.urlService.rules.otherwise({ state: 'portainer.auth' });
