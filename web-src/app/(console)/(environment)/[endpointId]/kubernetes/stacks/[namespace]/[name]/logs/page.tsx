'use client';

import { KubernetesStackLogsHeader } from '@console/console/platform/kubernetes/KubernetesApplicationPages';

import { KubernetesLogsContent } from '@/domains/applications/applications/LogsView/LogsView';

export default function Page() {
  return (
    <>
      <KubernetesStackLogsHeader />
      <KubernetesLogsContent isStack />
    </>
  );
}
