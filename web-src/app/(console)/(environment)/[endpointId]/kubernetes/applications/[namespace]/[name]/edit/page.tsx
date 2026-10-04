'use client';

import { ApplicationPageHeader } from '@console/console/platform/kubernetes/KubernetesApplicationPages';

import { ApplicationEditContent } from '@/domains/applications/applications/ApplicationEditorView/ApplicationEditorView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Edit application" suffix="Edit" />
      <ApplicationEditContent />
    </>
  );
}
