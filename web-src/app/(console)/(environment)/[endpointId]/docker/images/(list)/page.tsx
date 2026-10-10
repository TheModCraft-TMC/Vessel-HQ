'use client';

import { ImagesDatatable } from '@/domains/images/views/ListView/ImagesDatatable/ImagesDatatable';
import { PullImageFormWidget } from '@/domains/images/views/ListView/PullImageFormWidget';
import { useIsSwarmAgent } from '@/react/docker/proxy/queries/useIsSwarmAgent';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const isSwarmAgent = useIsSwarmAgent();

  return (
    <>
      <PageHeader title="Image list" breadcrumbs="Images" reload />
      <div>
        <div className="row">
          <div className="col-sm-12">
            <PullImageFormWidget isNodeVisible={isSwarmAgent} />
          </div>
        </div>
        <ImagesDatatable isHostColumnVisible={isSwarmAgent} />
      </div>
    </>
  );
}
