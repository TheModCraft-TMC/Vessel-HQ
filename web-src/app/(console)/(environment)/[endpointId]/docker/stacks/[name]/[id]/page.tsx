'use client';

import { ContainerPageHeader } from '@console/console/platform/docker/ContainerPageHeader';

import { ContainerDetailsContent } from '@/domains/containers/views/ContainerDetailsView/ContainerDetailsView';

export default function Page() {
  return (
    <>
      <ContainerPageHeader title="Container details" />
      <ContainerDetailsContent />
    </>
  );
}
