'use client';

import { ApplicationPageHeader } from '@app/_components/platform/kubernetes/KubernetesApplicationPages';
import { ApplicationEditContent } from '@app/_components/platform/kubernetes/applications/ApplicationEditorView/ApplicationEditorView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Edit application" suffix="Edit" />
      <ApplicationEditContent />
    </>
  );
}
