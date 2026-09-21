import {
  UIRouterReact,
  hashLocationPlugin,
  servicesPlugin,
} from '@uirouter/react';

import { registerAzureStates } from '@/features/azure';
import { registerDockerStates } from '@/docker/__module';
import { registerEdgeStates } from '@/edge/__module';
import { registerContainerStates } from '@/features/containers';
import { registerKubernetesStates } from '@/kubernetes/__module';
import { registerKubernetesTemplateStates } from '@/kubernetes/custom-templates';
import { registerPortainerStates } from '@/portainer/__module';
import { requiresAuthHook } from '@/portainer/authorization-guard';
import { registerRbacStates } from '@/portainer/rbac';
import { registerTeamStates } from '@/portainer/react/views/teams';
import { registerUpdateScheduleStates } from '@/portainer/react/views/update-schedules';
import { registerWizardStates } from '@/portainer/react/views/wizard';
import { registerRegistryStates } from '@/portainer/registry-management';
import { resetAgentHeaders } from '@/portainer/services/http-request.helper';
import { registerUserActivityStates } from '@/portainer/user-activity';

export const router = new UIRouterReact();

router.plugin(servicesPlugin);
router.plugin(hashLocationPlugin);
router.urlService.config.hashPrefix('!');

const registry = router.stateRegistry;
registerPortainerStates(registry);
registerRegistryStates(registry);
registerRbacStates(registry);
registerTeamStates(registry);
registerUpdateScheduleStates(registry);
registerWizardStates(registry);
registerUserActivityStates(registry);
registerDockerStates(registry);
registerContainerStates(registry);
registerKubernetesStates(registry);
registerKubernetesTemplateStates(registry);
registerEdgeStates(registry);
registerAzureStates(registry);

requiresAuthHook(router.transitionService);
router.transitionService.onBefore({}, () => {
  resetAgentHeaders();
});

router.urlService.rules.initial({ state: 'portainer.auth' });
router.urlService.rules.otherwise({ state: 'portainer.auth' });
