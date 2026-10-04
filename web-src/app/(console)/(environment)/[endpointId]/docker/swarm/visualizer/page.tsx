'use client';

import { SwarmVisualizerContent } from '@/domains/swarm/VisualizerView/VisualizerView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Swarm visualizer"
        breadcrumbs={[
          { label: 'Swarm', link: '/:endpointId/docker/swarm' },
          'Cluster visualizer',
        ]}
        reload
      />
      <SwarmVisualizerContent />
    </>
  );
}
