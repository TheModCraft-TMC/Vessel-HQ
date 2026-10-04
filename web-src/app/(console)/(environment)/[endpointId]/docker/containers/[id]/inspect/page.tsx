'use client';

import { ContainerPageHeader } from '@console/console/platform/docker/ContainerPageHeader';

import { ContainerInspectContent } from '@/domains/containers/views/ContainerInspectView/InspectView';

export default function Page() {
  return (
    <>
      <ContainerPageHeader title="Container inspect" suffix="Inspect" />
      <ContainerInspectContent />
    </>
  );
}
