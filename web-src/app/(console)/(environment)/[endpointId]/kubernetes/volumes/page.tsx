'use client';

import { KubernetesVolumesContent } from '@console/console/platform/kubernetes/KubernetesListPages';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Volume list" breadcrumbs="Volumes" reload />
      <KubernetesVolumesContent />
    </>
  );
}
