'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { HelmApplicationContent } from '@app/_components/platform/kubernetes/helm/HelmApplicationView/HelmApplicationView';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  const params = useRouteParams();

  return (
    <>
      <PageHeader
        title="Helm details"
        breadcrumbs={[
          {
            label: 'Applications',
            link: '/:endpointId/kubernetes/applications',
          },
          params.name,
        ]}
        reload
      />
      <HelmApplicationContent />
    </>
  );
}
