'use client';

import { useRouteParams } from '@console/routing/useRouteParams';
import { Link } from '@console/navigation/Link';
import { PageContent } from '@console/layout/PageContent';

import { useContainer } from '@/domains/containers/queries/useContainer';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { DockerLogsView } from '@app/_components/platform/docker/containers/ContainerLogs/DockerLogsView';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { InformationPanel } from '@/ui/components/feedback/InformationPanel';
import { ViewLoading } from '@/ui/components/feedback/ViewLoading';

export default function Page() {
  const environmentId = useEnvironmentId();
  const { id: containerId, nodeName } = useRouteParams();

  const containerQuery = useContainer(
    { environmentId, containerId, nodeName },
    {
      select: (c) => c,
    }
  );
  if (containerQuery.isLoading) {
    return <ViewLoading message="Loading container logs..." />;
  }

  if (!containerQuery.data) {
    return null;
  }

  const logsEnabled =
    containerQuery.data.HostConfig?.LogConfig?.Type && // if a portion of the object path doesn't exist, logging is likely disabled
    containerQuery.data.HostConfig.LogConfig.Type !== 'none'; // if type === none logging is disabled

  const container = containerQuery.data;
  const containerName = (container.Name || containerId).replace(/^\//, '');

  return (
    <PageContent>
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
    </PageContent>
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
