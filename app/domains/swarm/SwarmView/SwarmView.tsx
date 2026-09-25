import { useMemo } from 'react';

import { NodeViewModel } from '@/domains/swarm/models/node';
import { humanize } from '@/portainer/filters/filters';
import { useNodes, useInfo, useVersion } from '@/domains/swarm';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsEdgeAdmin } from '@/react/hooks/useUser';
import { Link } from '@/ui/components/links/Link';
import { PageHeader } from '@/ui/layouts/view-layout';

import { DetailsTable } from '@@/DetailsTable/DetailsTable';
import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';

import { NodesDatatable } from './NodesDatatable';

export function SwarmView() {
  const environmentId = useEnvironmentId();
  const nodesQuery = useNodes(environmentId);
  const infoQuery = useInfo(environmentId);
  const versionQuery = useVersion(environmentId);
  const { isAdmin } = useIsEdgeAdmin();
  const nodes = useMemo(
    () => nodesQuery.data?.map((node) => new NodeViewModel(node)),
    [nodesQuery.data]
  );
  const totalCPU =
    nodes?.reduce((total, node) => total + (node.CPUs || 0), 0) || 0;
  const totalMemory =
    nodes?.reduce((total, node) => total + (node.Memory || 0), 0) || 0;
  const apiVersion = Number.parseFloat(versionQuery.data?.ApiVersion || '0');

  return (
    <>
      <PageHeader title="Cluster overview" breadcrumbs={['Swarm']} reload />
      <div className="row">
        <div className="col-xs-12">
          <Widget>
            <WidgetTitle title="Cluster status" icon="trello" />
            <WidgetBody className="no-padding">
              <DetailsTable dataCy="swarm-cluster-status" className="!mb-0">
                <tr>
                  <td>Nodes</td>
                  <td>{infoQuery.data?.Swarm?.Nodes ?? nodes?.length}</td>
                </tr>
                <tr>
                  <td>Docker API version</td>
                  <td>{versionQuery.data?.ApiVersion}</td>
                </tr>
                <tr>
                  <td>Total CPU</td>
                  <td>{totalCPU / 1e9}</td>
                </tr>
                <tr>
                  <td>Total memory</td>
                  <td>{humanize(totalMemory, 2)}</td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Link
                      to="docker.swarm.visualizer"
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
      <NodesDatatable
        dataset={nodes}
        isIpColumnVisible={apiVersion >= 1.25}
        haveAccessToNode={isAdmin}
      />
    </>
  );
}
