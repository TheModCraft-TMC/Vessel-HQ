'use client';

import { KubernetesResourceDetailsHeader } from '@app/_components/platform/kubernetes/KubernetesResourcePages';
import { ResourceDetailsYAMLContent } from '@app/_components/platform/kubernetes/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Cluster Role details',
    breadcrumbLabel: 'Cluster Roles',
    breadcrumbLink: '/:endpointId/kubernetes/moreResources/clusterRoles',
    breadcrumbTab: 'clusterRoles',
    resourceType: 'clusterrole',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    resourcePlural: 'clusterroles',
    namespaced: false,
    yamlIdentifier: 'cluster-role-yaml',
    dataCy: 'cluster-role-yaml',
  },
};

export default function Page() {
  const config = routeData.resourceConfig;

  return (
    <>
      <KubernetesResourceDetailsHeader config={config} />
      <ResourceDetailsYAMLContent config={config} />
    </>
  );
}
