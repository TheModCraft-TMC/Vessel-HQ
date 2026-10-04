'use client';

import { ContainerPageHeader } from '@console/console/platform/docker/ContainerPageHeader';

import { ContainerConsole } from '@/domains/containers/views/ContainerConsoleView/ConsoleView';

export default function Page() {
  return (
    <>
      <ContainerPageHeader title="Container console" suffix="Console" />
      <ContainerConsole mode="exec" showHeader={false} />
    </>
  );
}
