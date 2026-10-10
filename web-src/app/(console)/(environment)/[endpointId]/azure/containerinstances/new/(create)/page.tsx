'use client';

import { CreateContainerInstanceForm } from '@/domains/azure/views/ContainerInstances/CreateView/CreateContainerInstanceForm';
import { PageHeader } from '@/ui/layouts/view-layout';

import { Widget, WidgetBody } from '@@/Widget';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create container instance"
        breadcrumbs={[
          {
            link: '/:endpointId/azure/containerinstances',
            label: 'Container instances',
          },
          { label: 'Add container' },
        ]}
        reload
      />
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <CreateContainerInstanceForm />
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}
