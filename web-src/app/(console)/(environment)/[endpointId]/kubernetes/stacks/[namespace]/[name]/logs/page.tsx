'use client';

import { KubernetesStackLogsHeader } from '@app/_components/platform/kubernetes/KubernetesApplicationPages';
import { KubernetesLogsContent } from '@app/_components/platform/kubernetes/applications/LogsView/LogsView';

export default function Page() {
  return (
    <>
      <KubernetesStackLogsHeader />
      <KubernetesLogsContent isStack />
    </>
  );
}
