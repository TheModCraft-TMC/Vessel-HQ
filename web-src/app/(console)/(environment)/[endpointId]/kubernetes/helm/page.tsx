'use client';

import { HelmInstallContent } from '@/domains/configuration/helm/install/HelmInstallView';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Helm install" breadcrumbs="Helm install" reload />
      <HelmInstallContent />
    </>
  );
}
