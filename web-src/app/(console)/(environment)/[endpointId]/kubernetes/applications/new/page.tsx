'use client';

import { ApplicationPageHeader } from '@app/_components/platform/kubernetes/KubernetesApplicationPages';
import { ApplicationCreateContent } from '@app/_components/platform/kubernetes/applications/ApplicationEditorView/ApplicationEditorView';

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
