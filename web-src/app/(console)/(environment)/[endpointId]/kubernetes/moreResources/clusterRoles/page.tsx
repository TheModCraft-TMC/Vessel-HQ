'use client';

import { KubernetesClusterRolesContent } from '@console/console/platform/kubernetes/KubernetesListPages';

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
