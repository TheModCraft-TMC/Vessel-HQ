'use client';

import {
  BoxIcon,
  CalendarCheck2,
  CalendarSync,
  Database,
  FileCode,
  HardDrive,
  Link,
  Lock,
  UserCheck,
} from 'lucide-react';

import { ApplicationsDatatable } from '@/domains/applications/applications/ListView/ApplicationsDatatable';
import { ApplicationsStacksDatatable } from '@/domains/applications/applications/ListView/ApplicationsStacksDatatable';
import { useKubeAppsTableStore } from '@/domains/applications/applications/ListView/useKubeAppsTableStore';
import { ConfigMapsDatatable } from '@/domains/configuration/configs/ListView/ConfigMapsDatatable';
import { SecretsDatatable } from '@/domains/configuration/configs/ListView/SecretsDatatable';
import { PersistentVolumeClaimsDatatable } from '@/domains/configuration/volumes/ListView/PersistentVolumeClaimsDatatable';
import { PersistentVolumesDatatable } from '@/domains/configuration/volumes/ListView/PersistentVolumesDatatable';
import { StorageClassesDatatable } from '@/domains/configuration/volumes/ListView/StorageClassesDatatable';
import { ClusterRoleBindingsDatatable } from '@/domains/kubernetes-access/more-resources/ClusterRolesView/ClusterRoleBindingsDatatable/ClusterRoleBindingsDatatable';
import { ClusterRolesDatatable } from '@/domains/kubernetes-access/more-resources/ClusterRolesView/ClusterRolesDatatable/ClusterRolesDatatable';
import { CronJobsDatatable } from '@/domains/kubernetes-access/more-resources/JobsView/CronJobsDatatable/CronJobsDatatable';
import { JobsDatatable } from '@/domains/kubernetes-access/more-resources/JobsView/JobsDatatable/JobsDatatable';
import { RoleBindingsDatatable } from '@/domains/kubernetes-access/more-resources/RolesView/RoleBindingsDatatable';
import { RolesDatatable } from '@/domains/kubernetes-access/more-resources/RolesView/RolesDatatable';
import { ServiceAccountsDatatable } from '@/domains/kubernetes-access/more-resources/ServiceAccountsView/ServiceAccountsDatatable';
import { usePublicSettings } from '@/domains/settings';
import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';

import { Tab, WidgetTabs, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

export function KubernetesApplicationsContent() {
  const tableState = useKubeAppsTableStore(
    '/:endpointId/kubernetes/applications',
    'Name'
  );
  const hideStacksQuery = usePublicSettings({
    select: (settings) =>
      settings.GlobalDeploymentOptions.hideStacksFunctionality,
  });
  const hideStacks = hideStacksQuery.isLoading || !!hideStacksQuery.data;
  const tabs: Tab[] = [
    {
      name: 'Applications',
      icon: BoxIcon,
      widget: <ApplicationsDatatable tableState={tableState} />,
      selectedTabParam: 'applications',
    },
    {
      name: 'Stacks',
      icon: Link,
      widget: <ApplicationsStacksDatatable tableState={tableState} />,
      selectedTabParam: 'stacks',
    },
  ];
  const currentTabIndex = useCurrentTabIndex(tabs);

  return hideStacks ? (
    <ApplicationsDatatable tableState={tableState} hideStacks />
  ) : (
    <TabbedContent tabs={tabs} index={currentTabIndex} />
  );
}

export function KubernetesServiceAccountsContent() {
  useUnauthorizedRedirect(
    { authorizations: ['K8sServiceAccountsW'], adminOnlyCE: true },
    { to: '/:endpointId/kubernetes/dashboard' }
  );
  return <ServiceAccountsDatatable />;
}

export function KubernetesConfigurationsContent() {
  return (
    <TabsContent
      tabs={[
        {
          name: 'ConfigMaps',
          icon: FileCode,
          widget: <ConfigMapsDatatable />,
          selectedTabParam: 'configmaps',
        },
        {
          name: 'Secrets',
          icon: Lock,
          widget: <SecretsDatatable />,
          selectedTabParam: 'secrets',
        },
      ]}
    />
  );
}

export function KubernetesVolumesContent() {
  return (
    <TabsContent
      tabs={[
        {
          name: 'Persistent volume claims',
          icon: Database,
          widget: <PersistentVolumeClaimsDatatable />,
          selectedTabParam: 'volume-claims',
        },
        {
          name: 'Persistent volumes',
          icon: Database,
          widget: <PersistentVolumesDatatable />,
          selectedTabParam: 'volumes',
        },
        {
          name: 'Storage classes',
          icon: HardDrive,
          widget: <StorageClassesDatatable />,
          selectedTabParam: 'storage',
        },
      ]}
    />
  );
}

export function KubernetesJobsContent() {
  useUnauthorizedRedirect(
    { authorizations: ['K8sJobsR', 'K8sCronJobsR'] },
    { to: '/:endpointId/kubernetes/dashboard' }
  );
  return (
    <TabsContent
      tabs={[
        {
          name: 'Cron Jobs',
          icon: CalendarSync,
          widget: <CronJobsDatatable />,
          selectedTabParam: 'cronJobs',
        },
        {
          name: 'Jobs',
          icon: CalendarCheck2,
          widget: <JobsDatatable />,
          selectedTabParam: 'jobs',
        },
      ]}
    />
  );
}

export function KubernetesRolesContent() {
  useUnauthorizedRedirect(
    { authorizations: ['K8sRoleBindingsW', 'K8sRolesW'], adminOnlyCE: true },
    { to: '/:endpointId/kubernetes/dashboard' }
  );
  return (
    <TabsContent
      tabs={[
        {
          name: 'Roles',
          icon: UserCheck,
          widget: <RolesDatatable />,
          selectedTabParam: 'roles',
        },
        {
          name: 'Role Bindings',
          icon: Link,
          widget: <RoleBindingsDatatable />,
          selectedTabParam: 'roleBindings',
        },
      ]}
    />
  );
}

export function KubernetesClusterRolesContent() {
  useUnauthorizedRedirect(
    {
      authorizations: ['K8sClusterRoleBindingsW', 'K8sClusterRolesW'],
      adminOnlyCE: true,
    },
    { to: '/:endpointId/kubernetes/dashboard' }
  );
  return (
    <TabsContent
      tabs={[
        {
          name: 'Cluster Roles',
          icon: UserCheck,
          widget: <ClusterRolesDatatable />,
          selectedTabParam: 'clusterRoles',
        },
        {
          name: 'Cluster Role Bindings',
          icon: Link,
          widget: <ClusterRoleBindingsDatatable />,
          selectedTabParam: 'clusterRoleBindings',
        },
      ]}
    />
  );
}

function TabsContent({ tabs }: { tabs: Tab[] }) {
  const currentTabIndex = useCurrentTabIndex(tabs);
  return <TabbedContent tabs={tabs} index={currentTabIndex} />;
}

function TabbedContent({ tabs, index }: { tabs: Tab[]; index: number }) {
  return (
    <>
      <WidgetTabs tabs={tabs} currentTabIndex={index} />
      <div className="content">{tabs[index].widget}</div>
    </>
  );
}
