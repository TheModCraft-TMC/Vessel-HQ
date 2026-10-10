'use client';

import { ApplicationPageHeader } from '@app/_components/platform/kubernetes/KubernetesApplicationPages';
import { ApplicationDetailsContent } from '@app/_components/platform/kubernetes/applications/DetailsView/ApplicationDetailsView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Application details" />
      <ApplicationDetailsContent />
    </>
  );
}
