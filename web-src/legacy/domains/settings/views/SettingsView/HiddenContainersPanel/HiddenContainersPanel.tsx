import { Box } from 'lucide-react';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import {
  useSettings,
  useUpdateSettingsMutation,
} from '@/domains/settings/queries';
import { Pair } from '@/domains/settings/models/types';

import { Widget } from '@@/Widget';

import { AddLabelForm } from './AddLabelForm';
import { HiddenContainersTable } from './HiddenContainersTable';

export function HiddenContainersPanel() {
  const settingsQuery = useSettings((settings) => settings.BlackListedLabels);
  const mutation = useUpdateSettingsMutation();

  if (!settingsQuery.data) {
    return null;
  }

  const labels = settingsQuery.data;
  return (
    <Widget>
      <Widget.Title icon={Box} title="Hidden containers" />
      <Widget.Body>
        <div className="mb-3">
          <TextTip color="blue">
            You can hide containers with specific labels from the Vessel HQ UI.
            You need to specify the label name and value.
          </TextTip>
        </div>

        <AddLabelForm
          isLoading={mutation.isLoading}
          onSubmit={(name, value) => handleSubmit([...labels, { name, value }])}
        />

        <HiddenContainersTable
          labels={labels}
          isLoading={mutation.isLoading}
          onDelete={(name) =>
            handleSubmit(labels.filter((label) => label.name !== name))
          }
        />
      </Widget.Body>
    </Widget>
  );

  function handleSubmit(labels: Pair[]) {
    mutation.mutate(
      {
        BlackListedLabels: labels,
      },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Hidden container settings updated');
        },
      }
    );
  }
}
