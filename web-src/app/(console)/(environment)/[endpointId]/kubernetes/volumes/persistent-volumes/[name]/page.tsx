'use client';

import { KubernetesResourceDetailsHeader } from '@app/_components/platform/kubernetes/KubernetesResourcePages';
import { ResourceDetailsYAMLContent } from '@app/_components/platform/kubernetes/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Persistent Volume details',
    breadcrumbLabel: 'Volumes',
    breadcrumbLink: '/:endpointId/kubernetes/volumes',
    breadcrumbTab: 'volumes',
    resourceType: 'persistentvolume',
    apiVersion: 'v1',
    resourcePlural: 'persistentvolumes',
    namespaced: false,
    yamlIdentifier: 'persistent-volume-yaml',
    dataCy: 'persistent-volume-yaml',
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
