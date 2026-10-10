'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export function KubernetesIngressEditorHeader({ isEdit }: { isEdit: boolean }) {
  const params = useRouteParams();
  const title = isEdit ? 'Edit ingress' : 'Create ingress';
  return (
    <PageHeader
      title={title}
      breadcrumbs={[
        { link: '/:endpointId/kubernetes/ingresses', label: 'Ingresses' },
        isEdit ? params.name || title : title,
      ]}
      reload
    />
  );
}
