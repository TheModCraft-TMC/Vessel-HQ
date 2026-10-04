'use client';

import { ApplicationPageHeader } from '@console/console/platform/kubernetes/KubernetesApplicationPages';

import { ApplicationCreateContent } from '@/domains/applications/applications/ApplicationEditorView/ApplicationEditorView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader
        title="Create application"
        suffix="Create an application"
      />
      <ApplicationCreateContent />
    </>
  );
}
