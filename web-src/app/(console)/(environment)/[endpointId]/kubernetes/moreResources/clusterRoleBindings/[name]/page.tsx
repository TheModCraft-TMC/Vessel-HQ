'use client';

import { KubernetesResourceDetailsHeader } from '@console/console/platform/kubernetes/KubernetesResourcePages';

import { ResourceDetailsYAMLContent } from '@/domains/kubernetes-access/more-resources/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Cluster Role Binding details',
    breadcrumbLabel: 'Cluster Roles',
    breadcrumbLink: '/:endpointId/kubernetes/moreResources/clusterRoles',
    breadcrumbTab: 'clusterRoleBindings',
    resourceType: 'clusterrolebinding',
    apiVersion: 'rbac.authorization.k8s.io/v1',
    resourcePlural: 'clusterrolebindings',
    namespaced: false,
    yamlIdentifier: 'cluster-role-binding-yaml',
    dataCy: 'cluster-role-binding-yaml',
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
