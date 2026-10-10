'use client';

import { KubernetesRolesContent } from '@app/_components/platform/kubernetes/KubernetesListPages';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Role list" breadcrumbs="Roles" reload />
      <KubernetesRolesContent />
    </>
  );
}
