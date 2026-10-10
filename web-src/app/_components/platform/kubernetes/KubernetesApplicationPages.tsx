'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export function KubernetesStackLogsHeader() {
  const params = useRouteParams();
  return (
    <PageHeader
      title="Stack logs"
      breadcrumbs={[
        { label: 'Applications', link: '/:endpointId/kubernetes/applications' },
        'Stacks',
        params.name,
        'Logs',
      ]}
    />
  );
}

export function ApplicationPageHeader({
  title,
  suffix,
}: {
  title: string;
  suffix?: string;
}) {
  const params = useRouteParams();
  const namespace = String(params.namespace || '');
  const name = String(params.name || '');
  return (
    <PageHeader
      title={title}
      breadcrumbs={[
        ...(namespace
          ? [
              {
                label: 'Namespaces',
                link: '/:endpointId/kubernetes/namespaces',
              },
              {
                label: namespace,
                link: '/:endpointId/kubernetes/namespaces/:id',
                linkParams: { id: namespace },
              },
            ]
          : []),
        {
          label: 'Applications',
          link: '/:endpointId/kubernetes/applications',
        },
        ...(name ? [name] : []),
        ...(suffix ? [suffix] : []),
      ]}
      reload={!suffix || suffix === 'Edit'}
    />
  );
}
