'use client';

import { KubernetesResourceDetailsHeader } from '@console/console/platform/kubernetes/KubernetesResourcePages';

import { ResourceDetailsYAMLContent } from '@/domains/kubernetes-access/more-resources/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Storage Class details',
    breadcrumbLabel: 'Volumes',
    breadcrumbLink: '/:endpointId/kubernetes/volumes',
    breadcrumbTab: 'storage',
    resourceType: 'storageclass',
    apiVersion: 'storage.k8s.io/v1',
    resourcePlural: 'storageclasses',
    namespaced: false,
    yamlIdentifier: 'storage-class-yaml',
    dataCy: 'storage-class-yaml',
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
