'use client';

import { KubernetesResourceEditorHeader } from '@console/console/platform/kubernetes/KubernetesResourcePages';

import { ResourceEditorContent } from '@/domains/configuration/configs/ResourceEditorView';

const routeData = {
  resourceEditorConfig: {
    title: 'Create ConfigMap',
    kind: 'ConfigMap',
    plural: 'configmaps',
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
