'use client';

import { KubernetesResourceDetailsHeader } from '@console/console/platform/kubernetes/KubernetesResourcePages';

import { ResourceDetailsYAMLContent } from '@/domains/kubernetes-access/more-resources/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Job details',
    breadcrumbLabel: 'Cron Jobs & Jobs',
    breadcrumbLink: '/:endpointId/kubernetes/moreResources/jobs',
    breadcrumbTab: 'jobs',
    resourceType: 'job',
    apiVersion: 'batch/v1',
    resourcePlural: 'jobs',
    namespaced: true,
    yamlIdentifier: 'job-yaml',
    dataCy: 'job-yaml',
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
