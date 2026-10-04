'use client';

import { ApplicationPageHeader } from '@console/console/platform/kubernetes/KubernetesApplicationPages';

import { ApplicationStatsContent } from '@/domains/applications/applications/StatsView/ApplicationStatsView';

export default function Page() {
  return (
    <>
      <ApplicationPageHeader title="Application stats" suffix="Stats" />
      <ApplicationStatsContent />
    </>
  );
}
