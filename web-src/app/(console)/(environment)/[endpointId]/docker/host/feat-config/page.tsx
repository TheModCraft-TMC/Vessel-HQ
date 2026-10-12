'use client';

import { FeaturesForm } from '@/core/docker/host/FeaturesConfigurationView/FeaturesConfigurationView';
import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';
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
