'use client';

import { ContainerPageHeader } from '@console/console/platform/docker/ContainerPageHeader';

import { ContainerLogsContent } from '@/domains/containers/views/ContainerLogsView/LogView';

export default function Page() {
  return (
    <>
      <ContainerPageHeader title="Container logs" suffix="Logs" />
      <ContainerLogsContent />
    </>
  );
}
