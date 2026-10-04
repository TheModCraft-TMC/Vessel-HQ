import { notFound } from 'next/navigation';
import { AuthenticationSettingsPageContent } from '@console/console/pages/AuthenticationSettingsPage';
import { EdgeComputeSettingsContent } from '@console/console/pages/EdgeComputeSettingsPage';

import { PageHeader } from '@/ui/layouts/view-layout';

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (section === 'authentication') {
    return (
      <>
        <PageHeader
          title="Authentication settings"
          breadcrumbs={[
            { label: 'Settings', link: '/settings' },
            'Authentication',
          ]}
          reload
        />
        <AuthenticationSettingsPageContent />
      </>
    );
  }
  if (section === 'edge-compute') {
    return (
      <>
        <PageHeader
          title="Settings"
          breadcrumbs={[
            { label: 'Settings', link: '/settings' },
            'Edge Compute',
          ]}
          reload
        />
        <EdgeComputeSettingsContent />
      </>
    );
  }
  notFound();
}
