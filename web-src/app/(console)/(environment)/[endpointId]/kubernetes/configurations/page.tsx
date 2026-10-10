'use client';

import { KubernetesConfigurationsContent } from '@app/_components/platform/kubernetes/KubernetesListPages';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader
        title="ConfigMap & Secret lists"
        breadcrumbs="ConfigMaps & Secrets"
        reload
      />
      <KubernetesConfigurationsContent />
    </>
  );
}
