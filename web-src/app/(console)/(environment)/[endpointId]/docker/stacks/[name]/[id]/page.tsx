'use client';

import { ContainerDetailsContent } from '@app/_components/platform/docker/containers/ContainerDetailsView/ContainerDetailsView';

import { ContainerPageHeader } from '../../../_components/ContainerPageHeader';

export default function Page() {
  return (
    <>
      <ContainerPageHeader title="Container details" />
      <ContainerDetailsContent />
    </>
  );
}
