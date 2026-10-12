import { GaugeIcon } from 'lucide-react';

import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { Widget } from '@/ui/components/Widget';
import { DetailsTable } from '@/ui/components/DetailsTable';
import { useApiVersion } from '@/core/composition/useAgentApiVersion';

import { useAgentNodes } from '../agent/queries/useAgentNodes';

import { ClusterVisualizerLink } from './ClusterVisualizerLink';

export function ClusterAgentInfo() {
  const environmentId = useEnvironmentId();

  const apiVersionQuery = useApiVersion(environmentId);

  const nodesCountQuery = useAgentNodes(environmentId, apiVersionQuery.data!, {
    select: (data) => data.length,
    enabled: apiVersionQuery.data !== undefined,
  });

  return (
    <Widget>
      <Widget.Title icon={GaugeIcon} title="Cluster information" />
      <Widget.Body className="!px-5 !py-0">
        <DetailsTable dataCy="cluster-agent-info">
          <DetailsTable.Row label="Nodes in the cluster">
            {nodesCountQuery.data}
          </DetailsTable.Row>

          <ClusterVisualizerLink />
        </DetailsTable>
      </Widget.Body>
    </Widget>
  );
}
