'use client';

import { HostBrowserContent } from '@/react/docker/host/BrowseView/BrowseView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Host browser"
        breadcrumbs={[
          { label: 'Host', link: '/:endpointId/docker/host' },
          'Browse',
        ]}
      />
      <HostBrowserContent mode="host" />
    </>
  );
}
