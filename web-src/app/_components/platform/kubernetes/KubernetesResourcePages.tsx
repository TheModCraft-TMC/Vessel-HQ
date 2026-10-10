'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import type { ResourceEditorConfig } from '@app/_components/platform/kubernetes/configuration/ResourceEditorView';
import type { ResourceConfig } from '@app/_components/platform/kubernetes/ResourceDetailsYAMLView';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export function KubernetesResourceEditorHeader({
  config,
}: {
  config: ResourceEditorConfig;
}) {
  const params = useRouteParams();

  return (
    <PageHeader
      title={config.title}
      breadcrumbs={[
        { label: 'Configurations', link: config.listRoute },
        config.isCreate ? `Add ${config.kind}` : params.name,
      ]}
      reload={!config.isCreate}
    />
  );
}

export function KubernetesResourceDetailsHeader({
  config,
}: {
  config: ResourceConfig;
}) {
  const params = useRouteParams();

  return (
    <PageHeader
      title={config.title}
      breadcrumbs={[
        {
          label: config.breadcrumbLabel,
          link: config.breadcrumbLink,
          linkParams: config.breadcrumbTab ? { tab: config.breadcrumbTab } : {},
        },
        params.name,
      ]}
      reload
    />
  );
}
