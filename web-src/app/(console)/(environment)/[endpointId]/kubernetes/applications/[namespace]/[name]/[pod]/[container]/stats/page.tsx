'use client';

import { ApplicationPageHeader } from '@app/_components/platform/kubernetes/KubernetesApplicationPages';
import { ApplicationStatsContent } from '@app/_components/platform/kubernetes/applications/StatsView/ApplicationStatsView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Application stats" suffix="Stats" />
      <ApplicationStatsContent />
    </>
  );
}
