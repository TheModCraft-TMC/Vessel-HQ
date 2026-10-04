'use client';

import { ApplicationPageHeader } from '@console/console/platform/kubernetes/KubernetesApplicationPages';

import { KubernetesLogsContent } from '@/domains/applications/applications/LogsView/LogsView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Application logs" suffix="Logs" />
      <KubernetesLogsContent />
    </>
  );
}
