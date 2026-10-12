import { GaugeIcon } from 'lucide-react';

import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';
import { stripProtocol } from '@/shared/strings';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import {
  isAgentEnvironment,
  isEdgeEnvironment,
} from '@/domains/environments';
import { DetailsTable } from '@/ui/components/DetailsTable';
import { Widget } from '@/ui/components/Widget';
import { useIsSwarmManager } from '@/core/composition/useDockerInfo';

import { GpuInfo } from './EnvironmentInfo.GpuInfo';
import { SnapshotStats } from './EnvironmentInfo.SnapshotStats';
import { DockerInfo } from './EnvironmentInfo.DockerInfo';
import { TagsInfo } from './EnvironmentInfo.TagsInfo';
import { ClusterVisualizerLink } from './ClusterVisualizerLink';

export function EnvironmentInfo() {
  const environmentId = useEnvironmentId();
  const envQuery = useCurrentEnvironment();

  const isSwarmManager = useIsSwarmManager(environmentId);

  if (!envQuery.data) {
    return null;
  }

  const environment = envQuery.data;

  const isAgent = isAgentEnvironment(environment.Type);
  const isEdgeAgent = isEdgeEnvironment(environment.Type);

  const isEnvUrlVisible = !isEdgeAgent;

  return (
    <Widget>
      <Widget.Title icon={GaugeIcon} title="Environment info" />
      <Widget.Body className="!px-5 !py-0">
        <DetailsTable dataCy="environment-info">
          <DetailsTable.Row label="Environment">
            <div className="flex items-center gap-2">
              {environment.Name}
              <SnapshotStats snapshot={environment.Snapshots[0]} />
              <span className="text-muted">-</span>
              <DockerInfo isAgent={isAgent} />
            </div>
          </DetailsTable.Row>

          {isEnvUrlVisible && (
            <DetailsTable.Row label="URL">
              {stripProtocol(environment.URL)}
            </DetailsTable.Row>
          )}

          <GpuInfo
            gpus={environment.Gpus || []}
            snapshot={environment.Snapshots[0]}
          />

          <TagsInfo ids={environment.TagIds} />

          {isSwarmManager && <ClusterVisualizerLink />}
        </DetailsTable>
      </Widget.Body>
    </Widget>
  );
}
