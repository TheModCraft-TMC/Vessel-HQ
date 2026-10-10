'use client';

import { FeaturesForm } from '@/react/docker/host/FeaturesConfigurationView/FeaturesConfigurationView';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentQuery = useCurrentEnvironment();

  return (
    <>
      <PageHeader
        title="Docker features configuration"
        breadcrumbs={['Docker configuration']}
      />
      {environmentQuery.data && (
        <FeaturesForm environment={environmentQuery.data} />
      )}
    </>
  );
}
