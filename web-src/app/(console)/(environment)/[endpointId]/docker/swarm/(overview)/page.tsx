'use client';

import { useMemo } from 'react';
import { Link } from '@console/navigation/Link';

import { NodeViewModel } from '@/domains/swarm/models/node';
import { useInfo, useVersion } from '@/domains/swarm/queries/useClusterInfo';
import { useNodes } from '@/domains/swarm/queries/useNodes';
import { NodesDatatable } from '@/domains/swarm/SwarmView/NodesDatatable';
import { humanize } from '@/shared/formatters';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { useIsEdgeAdmin } from '@/core/session/useUser';
import { PageHeader } from '@/ui/layouts/view-layout';
import { DetailsTable } from '@/ui/components/DetailsTable/DetailsTable';
import { Widget } from '@/ui/components/Widget/Widget';
import { WidgetBody } from '@/ui/components/Widget/WidgetBody';
import { WidgetTitle } from '@/ui/components/Widget/WidgetTitle';

export default function Page() {
  const environmentId = useEnvironmentId();
  const nodesQuery = useNodes(environmentId);
  const infoQuery = useInfo(environmentId);
  const versionQuery = useVersion(environmentId);
  const { isAdmin } = useIsEdgeAdmin();
  const nodes = useMemo(
    () => nodesQuery.data?.map((node) => new NodeViewModel(node)),
    [nodesQuery.data]
  );
  const { totalCpu, totalMemory } = useMemo(
    () => ({
      totalCpu:
        nodes?.reduce((total, node) => total + (node.CPUs || 0), 0) || 0,
      totalMemory:
        nodes?.reduce((total, node) => total + (node.Memory || 0), 0) || 0,
    }),
    [nodes]
  );
  const apiVersion = Number.parseFloat(versionQuery.data?.ApiVersion || '0');

  return (
    <>
      <PageHeader title="Cluster overview" breadcrumbs={['Swarm']} reload />
      <>
        <SwarmStatusPanel
          nodeCount={infoQuery.data?.Swarm?.Nodes ?? nodes?.length}
          apiVersion={versionQuery.data?.ApiVersion}
          totalCpu={totalCpu}
          totalMemory={totalMemory}
        />
        <NodesDatatable
          dataset={nodes}
          isIpColumnVisible={apiVersion >= 1.25}
          haveAccessToNode={isAdmin}
        />
      </>
    </>
  );
}

function SwarmStatusPanel({
  nodeCount,
  apiVersion,
  totalCpu,
  totalMemory,
}: {
  nodeCount?: number;
  apiVersion?: string;
  totalCpu: number;
  totalMemory: number;
}) {
  return (
    <div className="row">
      <div className="col-xs-12">
        <Widget>
          <WidgetTitle title="Cluster status" icon="trello" />
          <WidgetBody className="no-padding">
            <DetailsTable dataCy="swarm-cluster-status" className="mb-0!">
              <tr>
                <td>Nodes</td>
                <td>{nodeCount}</td>
              </tr>
              <tr>
                <td>Docker API version</td>
                <td>{apiVersion}</td>
              </tr>
              <tr>
                <td>Total CPU</td>
                <td>{totalCpu / 1e9}</td>
              </tr>
              <tr>
                <td>Total memory</td>
                <td>{humanize(totalMemory, 2)}</td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <Link
                    to="/:endpointId/docker/swarm/visualizer"
                    data-cy="swarm-visualizer-link"
                  >
                    Go to cluster visualizer
                  </Link>
                </td>
              </tr>
            </DetailsTable>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
