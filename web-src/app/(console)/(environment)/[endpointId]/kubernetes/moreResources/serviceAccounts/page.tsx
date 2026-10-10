'use client';

import { KubernetesServiceAccountsContent } from '@app/_components/platform/kubernetes/KubernetesListPages';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Service Account list"
        breadcrumbs="Service Accounts"
        reload
      />
      <KubernetesServiceAccountsContent />
    </>
  );
}
