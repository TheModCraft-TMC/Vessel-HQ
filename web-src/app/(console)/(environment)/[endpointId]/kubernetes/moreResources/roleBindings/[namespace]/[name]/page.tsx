'use client';

import { KubernetesResourceDetailsHeader } from '@app/_components/platform/kubernetes/KubernetesResourcePages';
import { ResourceDetailsYAMLContent } from '@app/_components/platform/kubernetes/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Role Binding details',
    breadcrumbLabel: 'Roles',
    breadcrumbLink: '/:endpointId/kubernetes/moreResources/roles',
    breadcrumbTab: 'roleBindings',
    resourceType: 'rolebinding',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    resourcePlural: 'rolebindings',
    namespaced: true,
    yamlIdentifier: 'role-binding-yaml',
    dataCy: 'role-binding-yaml',
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
