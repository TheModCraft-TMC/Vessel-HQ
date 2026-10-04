'use client';

import { DockerEventsContent } from '@console/console/platform/docker/DockerListPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Event list" breadcrumbs="Events" reload />
      <DockerEventsContent />
    </>
  );
}
