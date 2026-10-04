'use client';

import {
  BoxIcon,
  CpuIcon,
  DatabaseIcon,
  LayersIcon,
  ListIcon,
  NetworkIcon,
  ShuffleIcon,
} from 'lucide-react';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsEnvironmentAdmin } from '@/react/hooks/useUser';
import { ClusterAgentInfo } from '@/react/docker/DashboardView/ClusterAgentInfo';
import { ContainerStatus } from '@/react/docker/DashboardView/ContainerStatus';
import { EnvironmentInfo } from '@/react/docker/DashboardView/EnvironmentInfo';
import { ImagesTotalSize } from '@/react/docker/DashboardView/ImagesTotalSize';
import { NonAgentSwarmInfo } from '@/react/docker/DashboardView/NonAgentSwarmInfo';
import { useDashboard } from '@/react/docker/DashboardView/useDashboard';
import {
  useIsSwarm,
  useIsSwarmManager,
} from '@/react/docker/proxy/queries/useInfo';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';

import { DashboardItem } from '@@/DashboardItem';
import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';

export function DockerDashboardContent() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const environmentAdminQuery = useIsEnvironmentAdmin();
  const isSwarmManager = useIsSwarmManager(environmentId);
  const isStandalone = useIsSwarm(environmentId);
  const dashboardQuery = useDashboard(environmentId);

  if (!environmentQuery.data || !dashboardQuery.data) return null;

  const environment = environmentQuery.data;
  const stats = dashboardQuery.data;
  const stacksVisible =
    environment.SecuritySettings.allowStackManagementForRegularUsers ||
    environmentAdminQuery.authorized;

  return (
    <>
      <div className="mx-4 space-y-6">
        <DockerEnvironmentInformation
          isAgent={isAgentEnvironment(environment.Type)}
        />
        <DashboardGrid>
          {stacksVisible && (
            <DashboardItem
              to="/:endpointId/docker/stacks"
              icon={LayersIcon}
              type="Stack"
              value={stats.stacks}
              data-cy="stacks"
            />
          )}
          {isSwarmManager && (
            <DashboardItem
              to="/:endpointId/docker/services"
              icon={ShuffleIcon}
              type="Service"
              value={stats.services}
              data-cy="services"
            />
          )}
          <DashboardItem
            to="/:endpointId/docker/containers"
            icon={BoxIcon}
            type="Container"
            value={stats.containers.total}
            data-cy="containers"
          >
            <ContainerStatus stats={stats.containers} />
          </DashboardItem>
          <DashboardItem
            to="/:endpointId/docker/images"
            icon={ListIcon}
            type="Image"
            value={stats.images.total}
            data-cy="images"
          >
            <ImagesTotalSize imagesTotalSize={stats.images.size} />
          </DashboardItem>
          <DashboardItem
            to="/:endpointId/docker/volumes"
            icon={DatabaseIcon}
            type="Volume"
            value={stats.volumes}
            data-cy="volumes"
          />
          <DashboardItem
            to="/:endpointId/docker/networks"
            icon={NetworkIcon}
            type="Network"
            value={stats.networks}
            data-cy="networks"
          />
          {environment.EnableGPUManagement && isStandalone && (
            <DashboardItem
              icon={CpuIcon}
              type="GPU"
              value={environment.Gpus?.length}
              data-cy="gpus"
            />
          )}
        </DashboardGrid>
      </div>
      <div className="pt-6" />
    </>
  );
}

function DockerEnvironmentInformation({ isAgent }: { isAgent: boolean }) {
  const environmentId = useEnvironmentId();
  const isSwarm = useIsSwarm(environmentId);

  return (
    <>
      {isSwarm && !isAgent && <NonAgentSwarmInfo />}
      {isSwarm && isAgent && <ClusterAgentInfo />}
      {(!isSwarm || !isAgent) && <EnvironmentInfo />}
    </>
  );
}
