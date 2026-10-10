'use client';

import { KubernetesResourceDetailsHeader } from '@app/_components/platform/kubernetes/KubernetesResourcePages';
import { ResourceDetailsYAMLContent } from '@app/_components/platform/kubernetes/ResourceDetailsYAMLView';

const routeData = {
  resourceConfig: {
    title: 'Cron Job details',
    breadcrumbLabel: 'Cron Jobs & Jobs',
    breadcrumbLink: '/:endpointId/kubernetes/moreResources/jobs',
    breadcrumbTab: 'cronJobs',
    resourceType: 'cronjob',
    apiVersion: 'batch/v1',
    resourcePlural: 'cronjobs',
    namespaced: true,
    yamlIdentifier: 'cronjob-yaml',
    dataCy: 'cronjob-yaml',
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
