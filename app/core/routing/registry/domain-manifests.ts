import { routeManifest as azure } from '@/domains/azure/route-manifest';
import { routeManifest as containers } from '@/domains/containers/route-manifest';
import { routeManifest as edge } from '@/domains/edge/route-manifest';
import { registerDockerStates } from '@/docker/__module';
import { registerKubernetesStates } from '@/kubernetes/__module';
import { registerKubernetesTemplateStates } from '@/kubernetes/custom-templates';
import { registerPortainerStates } from '@/portainer/__module';
import { registerRbacStates } from '@/portainer/rbac';
import { registerTeamStates } from '@/portainer/react/views/teams';
import { registerUpdateScheduleStates } from '@/portainer/react/views/update-schedules';
import { registerWizardStates } from '@/portainer/react/views/wizard';
import { registerRegistryStates } from '@/portainer/registry-management';
import { registerUserActivityStates } from '@/portainer/user-activity';

import { createRouteManifest, type RouteManifest } from '../route-contracts';

const legacyDefinitions = [
  ['portainer', registerPortainerStates],
  ['registry-management', registerRegistryStates],
  ['rbac', registerRbacStates],
  ['teams', registerTeamStates],
  ['update-schedules', registerUpdateScheduleStates],
  ['wizard', registerWizardStates],
  ['user-activity', registerUserActivityStates],
  ['docker', registerDockerStates],
  ['kubernetes', registerKubernetesStates],
  ['kubernetes-templates', registerKubernetesTemplateStates],
] as const;

const legacyManifests: RouteManifest[] = legacyDefinitions.map(
  ([id, register]) =>
    createRouteManifest(id, (registry) => register(registry as never))
);

export const domainRouteManifests: RouteManifest[] = [
  ...legacyManifests,
  containers,
  azure,
  edge,
];
