'use client';

import { HelmInstallContent } from '@app/_components/platform/kubernetes/helm/install/HelmInstallView';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Helm install" breadcrumbs="Helm install" reload />
      <HelmInstallContent />
    </>
  );
}
