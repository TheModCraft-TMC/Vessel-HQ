import { useCurrentStateAndParams } from '@uirouter/react';

import { useContainer } from '@/features/containers/queries/useContainer';
import { ContainerDetailsViewModel } from '@/docker/models/containerDetails';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { DockerLogsView } from '@/react/docker/logs/DockerLogsView';

import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';
import { PageHeader } from '@@/PageHeader';

export function LogView() {
  const environmentId = useEnvironmentId();
  const {
    params: { id: containerId, nodeName },
  } = useCurrentStateAndParams();

  const containerQuery = useContainer(
    { environmentId, containerId, nodeName },
    {
      select: (c) => new ContainerDetailsViewModel(c),
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
      <PageHeader
        title="Container logs"
        breadcrumbs={[
          { label: 'Containers', link: 'docker.containers' },
          {
            label: containerName,
            link: 'docker.containers.container',
            linkParams: { id: container.Id },
          },
          'Logs',
        ]}
      />
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
  const {
    params: { id: containerId, nodeName },
  } = useCurrentStateAndParams();

  return (
    <div className="row">
      <div className="col-sm-12">
        <InformationPanel>
          <TextTip color="blue">
            Logging is disabled for this container. If you want to re-enable
            logging, please{' '}
            <Link
              to="docker.containers.new"
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
