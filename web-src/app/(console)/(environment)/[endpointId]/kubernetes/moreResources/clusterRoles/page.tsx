'use client';

import { KubernetesClusterRolesContent } from '@app/_components/platform/kubernetes/KubernetesListPages';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Cluster Role list"
        breadcrumbs="Cluster Roles"
        reload
      />
      <KubernetesClusterRolesContent />
    </>
  );
}
