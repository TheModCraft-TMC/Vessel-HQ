'use client';

import { KubernetesApplicationsContent } from '@console/console/platform/kubernetes/KubernetesListPages';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Application list" breadcrumbs="Applications" reload />
      <KubernetesApplicationsContent />
    </>
  );
}
