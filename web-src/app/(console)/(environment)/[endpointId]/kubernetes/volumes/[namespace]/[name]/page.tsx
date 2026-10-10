'use client';

import { KubernetesResourceDetailsHeader } from '@app/_components/platform/kubernetes/KubernetesResourcePages';
import { ResourceDetailsYAMLContent } from '@app/_components/platform/kubernetes/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Volume details',
    breadcrumbLabel: 'Volumes',
    breadcrumbLink: '/:endpointId/kubernetes/volumes',
    breadcrumbTab: 'volumes',
    resourceType: 'persistentvolumeclaim',
    apiVersion: 'v1',
    resourcePlural: 'persistentvolumeclaims',
    namespaced: true,
    yamlIdentifier: 'volume-yaml',
    dataCy: 'volume-yaml',
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
