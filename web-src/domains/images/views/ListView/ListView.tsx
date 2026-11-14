import { PageContent } from '@console/layout/PageContent';

import { PageHeader } from '@/ui/layouts/view-layout';
import { useIsSwarmAgent } from '@/core/docker/proxy/queries/useIsSwarmAgent';

import { PullImageFormWidget } from './PullImageFormWidget';
import { ImagesDatatable } from './ImagesDatatable/ImagesDatatable';

export function ListView() {
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
