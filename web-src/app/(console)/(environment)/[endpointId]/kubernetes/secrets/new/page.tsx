'use client';

import { KubernetesResourceEditorHeader } from '@app/_components/platform/kubernetes/KubernetesResourcePages';
import { ResourceEditorContent } from '@app/_components/platform/kubernetes/configuration/ResourceEditorView';

const routeData = {
  resourceEditorConfig: {
    title: 'Create secret',
    kind: 'Secret',
    plural: 'secrets',
    listRoute: '/:endpointId/kubernetes/configurations',
    isCreate: true,
  },
} as const;

export default function Page() {
  const config = routeData.resourceEditorConfig;

  return (
    <>
      <KubernetesResourceEditorHeader config={config} />
      <ResourceEditorContent config={config} />
    </>
  );
}
