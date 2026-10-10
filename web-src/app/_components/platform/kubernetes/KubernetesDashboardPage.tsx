'use client';

import { Box, Database, FileCode, Layers, Lock, Shuffle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import Route from '@/assets/ico/route.svg?c';
import { EnvironmentInfo } from '@/domains/clusters/dashboard/EnvironmentInfo';
import { useGetApplicationsCountQuery } from '@/domains/clusters/dashboard/queries/getApplicationsCountQuery';
import { useGetConfigMapsCountQuery } from '@/domains/clusters/dashboard/queries/getConfigMapsCountQuery';
import { useGetIngressesCountQuery } from '@/domains/clusters/dashboard/queries/getIngressesCountQuery';
import { useGetNamespacesCountQuery } from '@/domains/clusters/dashboard/queries/getNamespacesCountQuery';
import { useGetSecretsCountQuery } from '@/domains/clusters/dashboard/queries/getSecretsCountQuery';
import { useGetServicesCountQuery } from '@/domains/clusters/dashboard/queries/getServicesCountQuery';
import { useGetVolumesCountQuery } from '@/domains/clusters/dashboard/queries/getVolumesCountQuery';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { DashboardItem } from '@@/DashboardItem/DashboardItem';
import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';

export function KubernetesDashboardHeader() {
  const queryClient = useQueryClient();
  const environmentId = useEnvironmentId();

  return (
    <PageHeader
      title="Dashboard"
      breadcrumbs={[{ label: 'Environment summary' }]}
      reload
      onReload={() =>
        queryClient.invalidateQueries(['environments', environmentId])
      }
    />
  );
}

export function KubernetesDashboardContent() {
  const environmentId = useEnvironmentId();
  const applications = useGetApplicationsCountQuery(environmentId);
  const configMaps = useGetConfigMapsCountQuery(environmentId);
  const ingresses = useGetIngressesCountQuery(environmentId);
  const secrets = useGetSecretsCountQuery(environmentId);
  const services = useGetServicesCountQuery(environmentId);
  const volumes = useGetVolumesCountQuery(environmentId);
  const namespaces = useGetNamespacesCountQuery(environmentId);

  return (
    <div className="col-sm-12 flex flex-col gap-y-5">
        <EnvironmentInfo />
        <DashboardGrid>
          <CountCard
            query={namespaces}
            icon={Layers}
            to="/:endpointId/kubernetes/namespaces"
            type="Namespace"
            dataCy="dashboard-namespace"
          />
          <CountCard
            query={applications}
            icon={Box}
            to="/:endpointId/kubernetes/applications"
            type="Application"
            dataCy="dashboard-application"
          />
          <CountCard
            query={services}
            icon={Shuffle}
            to="/:endpointId/kubernetes/services"
            type="Service"
            dataCy="dashboard-service"
          />
          <CountCard
            query={ingresses}
            icon={Route}
            to="/:endpointId/kubernetes/ingresses"
            type="Ingress"
            pluralType="Ingresses"
            dataCy="dashboard-ingress"
          />
          <CountCard
            query={configMaps}
            icon={FileCode}
            to="/:endpointId/kubernetes/configurations"
            params={{ tab: 'configmaps' }}
            type="ConfigMap"
            dataCy="dashboard-configmaps"
          />
          <CountCard
            query={secrets}
            icon={Lock}
            to="/:endpointId/kubernetes/configurations"
            params={{ tab: 'secrets' }}
            type="Secret"
            dataCy="dashboard-secrets"
          />
          <CountCard
            query={volumes}
            icon={Database}
            to="/:endpointId/kubernetes/volumes"
            type="Volume"
            dataCy="dashboard-volume"
          />
        </DashboardGrid>
      </div>
  );
}

function CountCard({
  query,
  icon,
  to,
  type,
  pluralType,
  params,
  dataCy,
}: {
  query: { data?: number; isInitialLoading: boolean; isRefetching: boolean };
  icon: typeof Box;
  to: string;
  type: string;
  pluralType?: string;
  params?: Record<string, string>;
  dataCy: string;
}) {
  return (
    <DashboardItem
      value={query.data}
      isLoading={query.isInitialLoading}
      isRefetching={query.isRefetching}
      icon={icon}
      to={to}
      params={params}
      type={type}
      pluralType={pluralType}
      data-cy={dataCy}
    />
  );
}
