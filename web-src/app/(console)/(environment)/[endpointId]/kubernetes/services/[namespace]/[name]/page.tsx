'use client';

import { KubernetesResourceDetailsHeader } from '@app/_components/platform/kubernetes/KubernetesResourcePages';
import { ResourceDetailsYAMLContent } from '@app/_components/platform/kubernetes/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Service details',
    breadcrumbLabel: 'Services',
    breadcrumbLink: '/:endpointId/kubernetes/services',
    resourceType: 'service',
    apiVersion: 'v1',
    resourcePlural: 'services',
    namespaced: true,
    yamlIdentifier: 'service-yaml',
    dataCy: 'service-yaml',
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
