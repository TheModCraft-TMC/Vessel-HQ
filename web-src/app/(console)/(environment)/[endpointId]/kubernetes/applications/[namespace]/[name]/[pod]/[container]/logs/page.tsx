'use client';

import { ApplicationPageHeader } from '@app/_components/platform/kubernetes/KubernetesApplicationPages';
import { KubernetesLogsContent } from '@app/_components/platform/kubernetes/applications/LogsView/LogsView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Application logs" suffix="Logs" />
      <KubernetesLogsContent />
    </>
  );
}
