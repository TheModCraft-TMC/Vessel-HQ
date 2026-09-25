import { useQuery } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';
import { Node } from '@/providers/infrastructure/docker';

import { useApiVersion } from '@/react/docker/agent/queries/useApiVersion';
import { getNode } from '@/react/docker/proxy/queries/nodes/useNode';
import { useInfo } from '@/react/docker/proxy/queries/useInfo';
import { useVersion } from '@/react/docker/proxy/queries/useVersion';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsEdgeAdmin } from '@/react/hooks/useUser';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { withError } from '@/core/query';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { HostDetailsPanel } from '../HostDetailsPanel/HostDetailsPanel';
import { useAgentHostInfo } from '../queries/useAgentHostInfo';

import { EngineDetails, EngineDetailsPanel } from './EngineDetailsPanel';
import { DevicesPanel, DisksPanel } from './HardwarePanel';
import { NodeDetailsPanel } from './NodeDetailsPanel';

export function HostDetailsView() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const infoQuery = useInfo(environmentId);
  const versionQuery = useVersion(environmentId);
  const { isAdmin } = useIsEdgeAdmin();
  const environment = environmentQuery.data;
  const isAgent = Boolean(environment && isAgentEnvironment(environment.Type));
  const hostFeaturesEnabled = Boolean(
    environment?.SecuritySettings.enableHostManagementFeatures
  );
  const apiVersionQuery = useApiVersion(environmentId, { enabled: isAgent });
  const apiVersion = apiVersionQuery.data || 1;
  const hardwareEnabled =
    isAgent &&
    apiVersionQuery.isSuccess &&
    apiVersion >= 2 &&
    hostFeaturesEnabled;
  const hostInfoQuery = useAgentHostInfo(environmentId, apiVersion, undefined, {
    enabled: hardwareEnabled,
  });
  const info = infoQuery.data;
  const version = versionQuery.data;

  return (
    <>
      <PageHeader title="Host overview" breadcrumbs={['Docker']} reload />
      {info && version && (
        <>
          <HostDetailsPanel
            host={{
              os: {
                arch: info.Architecture || '',
                type: info.OSType || '',
                name: info.OperatingSystem || '',
              },
              name: info.Name || '',
              kernelVersion: info.KernelVersion,
              totalCPU: info.NCPU || 0,
              totalMemory: info.MemTotal || 0,
            }}
            isBrowseEnabled={
              isAdmin && hardwareEnabled && !apiVersionQuery.isLoading
            }
            browseUrl="docker.host.browser"
            endpointId={environmentId}
          />
          <EngineDetailsPanel
            engine={{
              releaseVersion: version.Version,
              apiVersion: version.ApiVersion,
              rootDirectory: info.DockerRootDir,
              storageDriver: info.Driver,
              loggingDriver: info.LoggingDriver,
              volumePlugins: info.Plugins?.Volume,
              networkPlugins: info.Plugins?.Network,
            }}
          />
          {hardwareEnabled && <HardwarePanels query={hostInfoQuery} />}
        </>
      )}
    </>
  );
}

export function NodeDetailsView() {
  const environmentId = useEnvironmentId();
  const environmentQuery = useCurrentEnvironment();
  const { isAdmin } = useIsEdgeAdmin();
  const {
    params: { id: nodeId },
  } = useCurrentStateAndParams();
  const nodeQuery = useQuery(
    ['environment', environmentId, 'docker', 'nodes', nodeId],
    () => getNode(environmentId, nodeId),
    {
      ...withError('Unable to retrieve node details'),
      enabled: Boolean(nodeId),
    }
  );
  const environment = environmentQuery.data;
  const isAgent = Boolean(environment && isAgentEnvironment(environment.Type));
  const hostFeaturesEnabled = Boolean(
    environment?.SecuritySettings.enableHostManagementFeatures
  );
  const apiVersionQuery = useApiVersion(environmentId, { enabled: isAgent });
  const apiVersion = apiVersionQuery.data || 1;
  const hardwareEnabled =
    isAgent &&
    apiVersionQuery.isSuccess &&
    apiVersion >= 2 &&
    hostFeaturesEnabled;
  const node = nodeQuery.data;
  const nodeName = node?.Description?.Hostname;
  const hostInfoQuery = useAgentHostInfo(environmentId, apiVersion, nodeName, {
    enabled: hardwareEnabled && Boolean(nodeName),
  });

  return (
    <>
      <PageHeader title="Host overview" breadcrumbs={['Docker']} reload />
      {node && (
        <>
          <HostDetailsPanel
            host={nodeHostDetails(node)}
            isBrowseEnabled={
              isAdmin && hardwareEnabled && !apiVersionQuery.isLoading
            }
            browseUrl="docker.nodes.node.browse"
          />
          <EngineDetailsPanel engine={nodeEngineDetails(node)} />
          {hardwareEnabled && <HardwarePanels query={hostInfoQuery} />}
          <NodeDetailsPanel
            key={`${node.ID}-${node.Version?.Index}`}
            environmentId={environmentId}
            node={node}
          />
        </>
      )}
    </>
  );
}

function HardwarePanels({
  query,
}: {
  query: ReturnType<typeof useAgentHostInfo>;
}) {
  return (
    <>
      <DevicesPanel
        devices={query.data?.PCIDevices}
        isLoading={query.isLoading}
        isError={query.isError}
      />
      <DisksPanel
        disks={query.data?.PhysicalDisks}
        isLoading={query.isLoading}
        isError={query.isError}
      />
    </>
  );
}

function nodeHostDetails(node: Node) {
  return {
    os: {
      arch: node.Description?.Platform?.Architecture || '',
      type: node.Description?.Platform?.OS || '',
      name: '',
    },
    name: node.Description?.Hostname || '',
    totalCPU: (node.Description?.Resources?.NanoCPUs || 0) / 1e9,
    totalMemory: node.Description?.Resources?.MemoryBytes || 0,
  };
}

function nodeEngineDetails(node: Node): EngineDetails {
  const plugins = node.Description?.Engine?.Plugins || [];
  const labels = node.Description?.Engine?.Labels || {};
  return {
    releaseVersion: node.Description?.Engine?.EngineVersion,
    volumePlugins: plugins
      .filter((plugin) => plugin.Type === 'Volume')
      .flatMap((plugin) => (plugin.Name ? [plugin.Name] : [])),
    networkPlugins: plugins
      .filter((plugin) => plugin.Type === 'Network')
      .flatMap((plugin) => (plugin.Name ? [plugin.Name] : [])),
    engineLabels: Object.entries(labels).map(([key, value]) => ({
      key,
      value,
    })),
  };
}
