'use client';

import { KubernetesJobsContent } from '@app/_components/platform/kubernetes/KubernetesListPages';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Cron Job & Job lists"
        breadcrumbs="Cron Jobs & Jobs"
        reload
      />
      <KubernetesJobsContent />
    </>
  );
}
