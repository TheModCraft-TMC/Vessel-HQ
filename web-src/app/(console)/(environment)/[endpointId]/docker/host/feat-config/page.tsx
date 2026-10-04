import { DockerFeaturesContent } from '@console/console/platform/docker/DockerSwarmPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Docker features configuration"
        breadcrumbs={['Docker configuration']}
      />
      <DockerFeaturesContent />
    </>
  );
}
