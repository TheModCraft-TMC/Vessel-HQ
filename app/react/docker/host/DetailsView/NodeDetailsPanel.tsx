import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Node, NodeSpec } from 'docker-types';
import { Plus, Trash2 } from 'lucide-react';

import { nodeStatusBadge } from '@/docker/filters/utils';
import { notifySuccess } from '@/portainer/services/notifications';
import { queryKeys } from '@/react/docker/proxy/queries/nodes/query-keys';
import { updateNode } from '@/react/docker/proxy/queries/nodes/useUpdateNodeMutation';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/core/query/query-client';

import { Button } from '@@/buttons';
import { DetailsTable } from '@@/DetailsTable/DetailsTable';
import { Input } from '@@/form-components/Input';
import { Widget } from '@@/Widget/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';
import { WidgetTitle } from '@@/Widget/WidgetTitle';

type Label = { key: string; value: string };

export function NodeDetailsPanel({
  environmentId,
  node,
}: {
  environmentId: EnvironmentId;
  node: Node;
}) {
  const queryClient = useQueryClient();
  const originalAvailability = node.Spec?.Availability || 'active';
  const originalLabels = useMemo(
    () => toLabels(node.Spec?.Labels),
    [node.Spec?.Labels]
  );
  const [availability, setAvailability] =
    useState<NodeSpec['Availability']>(originalAvailability);
  const [labels, setLabels] = useState<Label[]>(originalLabels);
  const updateMutation = useMutation(
    () => {
      if (!node.ID || node.Version?.Index === undefined) {
        throw new Error('Node identity or version is missing');
      }
      return updateNode(
        environmentId,
        node.ID,
        {
          Name: node.Spec?.Name,
          Role: node.Spec?.Role,
          Availability: availability,
          Labels: Object.fromEntries(
            labels
              .filter(({ key }) => key)
              .map(({ key, value }) => [key, value])
          ),
        },
        node.Version.Index
      );
    },
    {
      ...withError('Failed to update node'),
      onSuccess: async () => {
        notifySuccess('Node successfully updated', 'Node updated');
        await queryClient.invalidateQueries(queryKeys.base(environmentId));
      },
    }
  );

  const hasChanges =
    availability !== originalAvailability ||
    JSON.stringify(labels) !== JSON.stringify(originalLabels);
  const role = node.Spec?.Role;
  const managerAddress = role === 'manager' ? node.ManagerStatus?.Addr : '';

  return (
    <div className="row">
      <div className="col-xs-12">
        <Widget>
          <WidgetTitle title="Node Details" icon="code" />
          <WidgetBody className="no-padding">
            <DetailsTable dataCy="node-details" className="!mb-0">
              {node.Spec?.Name && (
                <tr>
                  <td>Node name</td>
                  <td>{node.Spec.Name}</td>
                </tr>
              )}
              <tr>
                <td>Role</td>
                <td>
                  {role} {managerAddress && `(${managerAddress})`}
                </td>
              </tr>
              <tr>
                <td>Availability</td>
                <td>
                  <select
                    className="form-control"
                    value={availability}
                    onChange={(event) =>
                      setAvailability(
                        event.target.value as NodeSpec['Availability']
                      )
                    }
                    data-cy="node-availability-select"
                  >
                    <option value="active">Active</option>
                    <option value="pause">Pause</option>
                    <option value="drain">Drain</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Status</td>
                <td>
                  <span
                    className={`label label-${nodeStatusBadge(node.Status?.State)}`}
                  >
                    {node.Status?.State}
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="flex items-center justify-between">
                    <span>Node Labels</span>
                    <Button
                      color="secondary"
                      icon={Plus}
                      onClick={() =>
                        setLabels((current) => [
                          ...current,
                          { key: '', value: '' },
                        ])
                      }
                      data-cy="node-add-label"
                    >
                      Label
                    </Button>
                  </div>
                </td>
                <td />
              </tr>
              <tr>
                <td colSpan={2}>
                  <div className="flex flex-col gap-2">
                    {labels.map((label, index) => (
                      <div
                        className="flex items-center gap-2"
                        key={`${index}-${labels.length}`}
                      >
                        <Input
                          value={label.key}
                          placeholder="Label name"
                          onChange={(event) =>
                            updateLabel(index, 'key', event.target.value)
                          }
                          data-cy={`node-label-key-${index}`}
                        />
                        <Input
                          value={label.value}
                          placeholder="Value"
                          onChange={(event) =>
                            updateLabel(index, 'value', event.target.value)
                          }
                          data-cy={`node-label-value-${index}`}
                        />
                        <Button
                          color="dangerlight"
                          icon={Trash2}
                          onClick={() =>
                            setLabels((current) =>
                              current.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                          data-cy={`node-remove-label-${index}`}
                        />
                      </div>
                    ))}
                    {!labels.length && (
                      <span className="text-muted">No labels configured.</span>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <div className="flex gap-2">
                    <Button
                      disabled={!hasChanges || updateMutation.isLoading}
                      onClick={() => updateMutation.mutate()}
                      data-cy="node-apply-changes"
                    >
                      Apply changes
                    </Button>
                    <Button
                      color="default"
                      disabled={!hasChanges}
                      onClick={() => {
                        setAvailability(originalAvailability);
                        setLabels(originalLabels);
                      }}
                      data-cy="node-reset-changes"
                    >
                      Reset changes
                    </Button>
                  </div>
                </td>
              </tr>
            </DetailsTable>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );

  function updateLabel(index: number, field: keyof Label, value: string) {
    setLabels((current) =>
      current.map((label, itemIndex) =>
        itemIndex === index ? { ...label, [field]: value } : label
      )
    );
  }
}

function toLabels(labels: NodeSpec['Labels']): Label[] {
  return Object.entries(labels || {}).map(([key, value]) => ({ key, value }));
}
