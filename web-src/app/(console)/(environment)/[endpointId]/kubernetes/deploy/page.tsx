'use client';

import { KubernetesDeployContent } from '@app/_components/platform/kubernetes/applications/DeployView/DeployView';
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
