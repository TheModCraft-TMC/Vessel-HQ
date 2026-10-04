'use client';

import { ContainerPageHeader } from '@console/console/platform/docker/ContainerPageHeader';

import { ContainerStatsContent } from '@/domains/containers/views/ContainerStatsView/StatsView';

export default function Page() {
  return (
    <>
      <ContainerPageHeader title="Container statistics" suffix="Stats" />
      <ContainerStatsContent />
    </>
  );
}
