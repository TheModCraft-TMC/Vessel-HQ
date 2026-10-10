'use client';

import { KubernetesResourceDetailsHeader } from '@app/_components/platform/kubernetes/KubernetesResourcePages';
import { ResourceDetailsYAMLContent } from '@app/_components/platform/kubernetes/ResourceDetailsYAMLView';

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
