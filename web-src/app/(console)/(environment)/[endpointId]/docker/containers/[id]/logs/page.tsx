'use client';

import { useRouteParams } from '@console/console/routing/useRouteParams';

import { useContainer } from '@/domains/containers/queries/useContainer';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { DockerLogsView } from '@app/_components/platform/docker/containers/ContainerLogs/DockerLogsView';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { Link } from '@/ui/components/links/Link';

import { InformationPanel } from '@@/InformationPanel';

export default function Page() {
  const environmentId = useEnvironmentId();
  const { id: containerId, nodeName } = useRouteParams();

  const containerQuery = useContainer(
    { environmentId, containerId, nodeName },
    {
      select: (c) => c,
    }
  );
  if (!containerQuery.data || containerQuery.isLoading) {
    return null;
  }

  const logsEnabled =
    containerQuery.data.HostConfig?.LogConfig?.Type && // if a portion of the object path doesn't exist, logging is likely disabled
    containerQuery.data.HostConfig.LogConfig.Type !== 'none'; // if type === none logging is disabled

  const container = containerQuery.data;
  const containerName = (container.Name || containerId).replace(/^\//, '');

  return (
    <>
      {!logsEnabled ? (
        <LogsDisabledInfoPanel />
      ) : (
        <DockerLogsView
          environmentId={environmentId}
          resource="containers"
          resourceId={containerId}
          resourceName={containerName}
          nodeName={nodeName}
          multiplexed={!container.Config?.Tty}
        />
      )}
    </>
  );
}

function LogsDisabledInfoPanel() {
  const { id: containerId, nodeName } = useRouteParams();

  return (
    <div className="row">
      <div className="col-sm-12">
        <InformationPanel>
          <TextTip color="blue">
            Logging is disabled for this container. If you want to re-enable
            logging, please{' '}
            <Link
              to="/:endpointId/docker/containers/new"
              params={{ from: containerId, nodeName }}
              data-cy="redeploy-container-link"
            >
              redeploy your container
            </Link>{' '}
            and select a logging driver in the &quot;Command & logging&quot;
            panel.
          </TextTip>
        </InformationPanel>
      </div>
    </div>
  );
}
