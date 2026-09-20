import { useMemo } from 'react';
import { Node, Task, TaskState } from 'docker-types';

import { humanize } from '@/portainer/filters/filters';
import { hideShaSum, nodeStatusBadge } from '@/docker/filters/utils';
import { useNodes } from '@/react/docker/proxy/queries/nodes/useNodes';
import { useTasks } from '@/react/docker/proxy/queries/tasks/useTasks';
import { useServices } from '@/react/docker/services/queries/useServices';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useLocalStorage } from '@/react/hooks/useLocalStorage';
import { strToHash } from '@/react/utils/hash';

import { Button } from '@@/buttons';
import { SwitchField } from '@@/form-components/SwitchField';
import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';

export function VisualizerView() {
  const environmentId = useEnvironmentId();
  const nodesQuery = useNodes(environmentId);
  const servicesQuery = useServices({ environmentId });
  const tasksQuery = useTasks<Task[]>({ environmentId });
  const [showInformation, setShowInformation] = useLocalStorage(
    'swarmvisualizer_show_info_panel',
    true
  );
  const [onlyRunning, setOnlyRunning] = useLocalStorage(
    'swarmvisualizer_display_only_running_tasks',
    false
  );
  const [displayNodeLabels, setDisplayNodeLabels] = useLocalStorage(
    'swarmvisualizer_display_node_labels',
    false
  );
  const serviceNames = useMemo(
    () =>
      new Map(
        servicesQuery.data?.map((service) => [
          service.ID || '',
          service.Spec?.Name || '',
        ])
      ),
    [servicesQuery.data]
  );
  const tasksByNode = useMemo(() => {
    const result = new Map<string, Task[]>();
    tasksQuery.data?.forEach((task) => {
      const nodeTasks = result.get(task.NodeID || '') || [];
      nodeTasks.push(task);
      result.set(task.NodeID || '', nodeTasks);
    });
    return result;
  }, [tasksQuery.data]);
  const nodes = [...(nodesQuery.data || [])].sort(compareNodes);

  return (
    <>
      <PageHeader
        title="Swarm visualizer"
        breadcrumbs={[
          { label: 'Swarm', link: 'docker.swarm' },
          'Cluster visualizer',
        ]}
        reload
      />
      <div className="row">
        <div className="col-xs-12">
          <Widget>
            <WidgetTitle title="Cluster information" icon="trello">
              <Button
                onClick={() => setShowInformation(!showInformation)}
                data-cy="swarm-toggle-information"
              >
                {showInformation ? 'Hide' : 'Show'}
              </Button>
            </WidgetTitle>
            {showInformation && (
              <WidgetBody>
                <table className="table">
                  <tbody>
                    <tr>
                      <td>Nodes</td>
                      <td>{nodesQuery.data?.length || 0}</td>
                    </tr>
                    <tr>
                      <td>Services</td>
                      <td>{servicesQuery.data?.length || 0}</td>
                    </tr>
                    <tr>
                      <td>Tasks</td>
                      <td>{tasksQuery.data?.length || 0}</td>
                    </tr>
                  </tbody>
                </table>
                <form className="form-horizontal">
                  <div className="col-sm-12 form-section-title">Options</div>
                  <div className="form-group">
                    <div className="col-sm-12">
                      <SwitchField
                        label="Only display running tasks"
                        labelClass="col-sm-2"
                        checked={onlyRunning}
                        onChange={setOnlyRunning}
                        data-cy="swarm-only-running-tasks"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <div className="col-sm-12">
                      <SwitchField
                        label="Display node labels"
                        labelClass="col-sm-2"
                        checked={displayNodeLabels}
                        onChange={setDisplayNodeLabels}
                        data-cy="swarm-display-node-labels"
                      />
                    </div>
                  </div>
                </form>
              </WidgetBody>
            )}
          </Widget>
        </div>
      </div>

      <div className="row">
        <div className="col-xs-12">
          <Widget>
            <WidgetTitle title="Cluster visualizer" icon="trello" />
            <WidgetBody
              loading={
                nodesQuery.isLoading ||
                servicesQuery.isLoading ||
                tasksQuery.isLoading
              }
            >
              <div className="visualizer_container">
                {nodes.map((node) => {
                  const tasks = (tasksByNode.get(node.ID || '') || [])
                    .filter(
                      (task) => !onlyRunning || task.Status?.State === 'running'
                    )
                    .sort((left, right) =>
                      (
                        serviceNames.get(left.ServiceID || '') || ''
                      ).localeCompare(
                        serviceNames.get(right.ServiceID || '') || ''
                      )
                    );
                  return (
                    <NodeCard
                      key={node.ID}
                      node={node}
                      tasks={tasks}
                      serviceNames={serviceNames}
                      displayNodeLabels={displayNodeLabels}
                    />
                  );
                })}
              </div>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}

function NodeCard({
  node,
  tasks,
  serviceNames,
  displayNodeLabels,
}: {
  node: Node;
  tasks: Task[];
  serviceNames: Map<string, string>;
  displayNodeLabels: boolean;
}) {
  const labels = Object.entries(node.Spec?.Labels || {});
  return (
    <div className="node">
      <div className="node_info">
        <div>
          <b>{node.Spec?.Name || node.Description?.Hostname}</b>{' '}
          <span className="node_platform">
            {node.Description?.Platform?.OS}
          </span>
        </div>
        <div>{node.Spec?.Role}</div>
        <div>CPU: {(node.Description?.Resources?.NanoCPUs || 0) / 1e9}</div>
        <div>
          Memory: {humanize(node.Description?.Resources?.MemoryBytes || 0, 2)}
        </div>
        <div>
          <span
            className={`label label-${nodeStatusBadge(node.Status?.State)}`}
          >
            {node.Status?.State}
          </span>
        </div>
        {displayNodeLabels && labels.length > 0 && (
          <div className="node_labels">
            <div>Labels</div>
            {labels.map(([key, value]) => (
              <div className="node_label" key={key}>
                <span className="label_key">{key}</span>
                {value && <span className="label_value"> = {value}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="tasks">
        {tasks.map((task) => (
          <TaskCard
            key={task.ID}
            task={task}
            serviceName={serviceNames.get(task.ServiceID || '') || ''}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, serviceName }: { task: Task; serviceName: string }) {
  const limits = task.Spec?.Resources?.Limits;
  const state = task.Status?.State;
  return (
    <div
      className={`task task_${taskClass(state)}`}
      style={{ border: `2px solid ${taskBorderColor(task.ServiceID || '')}` }}
    >
      <div className="service_name">{serviceName}</div>
      <div>Image: {hideShaSum(task.Spec?.ContainerSpec?.Image || '')}</div>
      <div>Status: {state}</div>
      <div>Update: {task.UpdatedAt}</div>
      {!!limits?.MemoryBytes && (
        <div>Memory limit: {humanize(limits.MemoryBytes, 2)}</div>
      )}
      {!!limits?.NanoCPUs && <div>CPU limit: {limits.NanoCPUs / 1e9}</div>}
    </div>
  );
}

function compareNodes(left: Node, right: Node) {
  const leftValue = `${left.Spec?.Role}-${left.Description?.Hostname}`;
  const rightValue = `${right.Spec?.Role}-${right.Description?.Hostname}`;
  return leftValue.localeCompare(rightValue);
}

function taskClass(state?: TaskState) {
  if (
    [
      'new',
      'allocated',
      'assigned',
      'accepted',
      'complete',
      'preparing',
    ].includes(state || '')
  ) {
    return 'info';
  }
  if (state === 'pending') {
    return 'warning';
  }
  if (['shutdown', 'failed', 'rejected'].includes(state || '')) {
    return 'stopped';
  }
  return 'running';
}

function taskBorderColor(serviceId: string) {
  const hash = strToHash(serviceId);
  let color = '#';
  for (let index = 0; index < 3; index += 1) {
    color += `00${((hash >> (index * 8)) & 0xff).toString(16)}`.slice(-2);
  }
  return color;
}
