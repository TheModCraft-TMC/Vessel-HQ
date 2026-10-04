'use client';

import { KubernetesResourceDetailsHeader } from '@console/console/platform/kubernetes/KubernetesResourcePages';

import { ResourceDetailsYAMLContent } from '@/domains/kubernetes-access/more-resources/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Role details',
    breadcrumbLabel: 'Roles',
    breadcrumbLink: '/:endpointId/kubernetes/moreResources/roles',
    breadcrumbTab: 'roles',
    resourceType: 'role',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    resourcePlural: 'roles',
    namespaced: true,
    yamlIdentifier: 'role-yaml',
    dataCy: 'role-yaml',
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
