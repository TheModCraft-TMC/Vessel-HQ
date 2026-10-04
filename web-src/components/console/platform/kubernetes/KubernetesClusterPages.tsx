'use client';

import { ConfigureForm } from '@/domains/clusters/cluster/ConfigureView/ConfigureForm';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { Widget, WidgetBody } from '@@/Widget';

export function KubernetesConfigureContent() {
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <ConfigureForm />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}

export function ClusterPageHeader({
  environment,
  suffix,
  title,
}: {
  environment?: { Id: number; Name: string };
  suffix: string;
  title: string;
}) {
  return (
    <PageHeader
      title={title}
      breadcrumbs={[
        { label: 'Environments', link: '/environments' },
        {
          label: environment?.Name || '',
          link: '/environments/:id',
          linkParams: { id: environment?.Id },
        },
        suffix,
      ]}
      reload
    />
  );
}
