'use client';

import { KubernetesDeployContent } from '@/domains/applications/DeployView/DeployView';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create from code"
        breadcrumbs={['Deploy Kubernetes resources']}
        reload
      />
      <KubernetesDeployContent />
    </>
  );
}
