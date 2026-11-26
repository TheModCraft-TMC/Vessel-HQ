'use client';

import { PageContent } from '@console/layout/PageContent';

import { ImagesDatatable } from '@/domains/images/views/ListView/ImagesDatatable/ImagesDatatable';
import { PullImageFormWidget } from '@/domains/images/views/ListView/PullImageFormWidget';
import { useIsSwarmAgent } from '@/core/docker/proxy/queries/useIsSwarmAgent';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const isSwarmAgent = useIsSwarmAgent();

  return (
    <>
      <PageHeader title="Image list" breadcrumbs="Images" reload />
      <PageContent>
        <PullImageFormWidget isNodeVisible={isSwarmAgent} />
        <ImagesDatatable isHostColumnVisible={isSwarmAgent} />
      </PageContent>
    </>
  );
}
