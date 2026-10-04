import { DockerSwarmContent } from '@console/console/platform/docker/DockerSwarmPages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Cluster overview" breadcrumbs={['Swarm']} reload />
      <DockerSwarmContent />
    </>
  );
}
