import { ReactNode } from 'react';
import { FormikHandlers } from 'formik';

import { useEdgeGroups } from '@/domains/edge/queries/edge-groups/useEdgeGroups';
import { FormControl } from '@/ui/components/forms/FormControl';
import { Select } from '@/ui/components/forms/ReactSelect';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { EdgeGroup } from '@/domains/edge/models/edge-group';

interface Props {
  disabled?: boolean;
  onBlur: FormikHandlers['handleBlur'];
  value: EdgeGroup['Id'][];
  error?: ReactNode;
  onChange(value: EdgeGroup['Id'][]): void;
}

export function EdgeGroupsField({
  disabled,
  onBlur,
  value,
  error,
  onChange,
}: Props) {
  const groupsQuery = useEdgeGroups();

  const selectedGroups = groupsQuery.data?.filter((group) =>
    value.includes(group.Id)
  );

  return (
    <div>
      <FormControl
        label="Groups"
        required
        inputId="groups-select"
        errors={error}
        tooltip="Updates are done based on groups, allowing you to choose multiple devices at the same time and the ability to roll out progressively across all environments by scheduling them for different days."
      >
        <Select
          name="groupIds"
          onBlur={onBlur}
          value={selectedGroups}
          inputId="groups-select"
          placeholder="Select one or multiple group(s)"
          onChange={(selectedGroups) =>
            onChange(selectedGroups.map((g) => g.Id))
          }
          isMulti
          options={groupsQuery.data || []}
          getOptionLabel={(group) => group.Name}
          getOptionValue={(group) => group.Id.toString()}
          closeMenuOnSelect={false}
          isDisabled={disabled}
          data-cy="update-schedules-edge-groups-select"
          id="update-schedules-edge-groups-select"
        />
      </FormControl>
      <TextTip color="blue">
        Select groups of Edge environments to update
      </TextTip>
    </div>
  );
}
