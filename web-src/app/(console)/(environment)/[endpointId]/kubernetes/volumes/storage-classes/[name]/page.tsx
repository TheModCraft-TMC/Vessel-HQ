'use client';

import { KubernetesResourceDetailsHeader } from '@app/_components/platform/kubernetes/KubernetesResourcePages';
import { ResourceDetailsYAMLContent } from '@app/_components/platform/kubernetes/ResourceDetailsYAMLView';

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
