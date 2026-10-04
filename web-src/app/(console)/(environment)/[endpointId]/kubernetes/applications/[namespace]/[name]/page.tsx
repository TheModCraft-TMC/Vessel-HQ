'use client';

import { ApplicationPageHeader } from '@console/console/platform/kubernetes/KubernetesApplicationPages';

import { ApplicationDetailsContent } from '@/domains/applications/applications/DetailsView/ApplicationDetailsView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Application details" />
      <ApplicationDetailsContent />
    </>
  );
}
