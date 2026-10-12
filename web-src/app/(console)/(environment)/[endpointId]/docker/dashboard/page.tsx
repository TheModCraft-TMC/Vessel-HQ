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
import { PageContent } from '@console/layout/PageContent';

import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { useIsEnvironmentAdmin } from '@/core/session/useUser';
import { ClusterAgentInfo } from '@/core/docker/DashboardView/ClusterAgentInfo';
import { ContainerStatus } from '@/core/docker/DashboardView/ContainerStatus';
import { EnvironmentInfo } from '@/core/docker/DashboardView/EnvironmentInfo';
import { ImagesTotalSize } from '@/core/docker/DashboardView/ImagesTotalSize';
import { NonAgentSwarmInfo } from '@/core/docker/DashboardView/NonAgentSwarmInfo';
import { useDashboard } from '@/core/docker/DashboardView/useDashboard';
import {
  useIsSwarm,
  useIsSwarmManager,
} from '@/core/composition/useDockerInfo';
import { isAgentEnvironment } from '@/domains/environments/utils';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { DashboardItem } from '@/ui/components/DashboardItem';
import { DashboardGrid } from '@/ui/components/DashboardItem/DashboardGrid';

export default function Page() {
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
      <PageHeader title="Dashboard" breadcrumbs="Environment summary" reload />
      <PageContent gap="large">
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
      </PageContent>
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
