'use client';

import { KubernetesRolesContent } from '@console/console/platform/kubernetes/KubernetesListPages';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Role list" breadcrumbs="Roles" reload />
      <KubernetesRolesContent />
    </>
  );
}
