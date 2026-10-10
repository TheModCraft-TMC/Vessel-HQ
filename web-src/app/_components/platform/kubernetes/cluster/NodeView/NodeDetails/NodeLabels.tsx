import clsx from 'clsx';
import { FormikErrors } from 'formik';

import { FormSection } from '@/ui/components/forms/FormSection';
import { InputList } from '@/ui/components/forms/InputList';
import { ItemProps } from '@/ui/components/forms/InputList/InputList';
import { isErrorType } from '@/ui/components/forms/formikUtils';
import { FormError } from '@/ui/components/forms/FormError';
import { InputGroup } from '@/ui/components/forms/InputGroup';
import { Badge } from '@/ui/components/status/Badge';
import { NodeLabel } from '@/domains/clusters';

import { createNewLabel } from './nodeFormUtils';

interface Props {
  labels: NodeLabel[];
  errors: FormikErrors<NodeLabel[]>;
  onChangeLabels: (labels: NodeLabel[]) => void;
  hasNodeWriteAccess: boolean;
}

export function NodeLabels({
  labels,
  onChangeLabels,
  errors,
  hasNodeWriteAccess,
}: Props) {
  return (
    <FormSection title="Labels">
      <InputList<NodeLabel>
        value={labels}
        onChange={onChangeLabels}
        data-cy="node-labels-input"
        item={NodeLabelItem}
        addLabel="Add label"
        canUndoDelete
        itemBuilder={createNewLabel}
        errors={errors}
        readOnly={!hasNodeWriteAccess}
      />
    </FormSection>
  );
}

function NodeLabelItem({
  onChange,
  item,
  error,
  disabled,
  readOnly,
  index,
}: ItemProps<NodeLabel>) {
  const formikError = isErrorType(error) ? error : undefined;
  return (
    <div className="mr-2 flex flex-wrap items-center gap-2">
      <div className="w-64 flex-none">
        <InputGroup
          size="small"
          className={clsx(item.needsDeletion && 'striked')}
        >
          <InputGroup.Addon>Name</InputGroup.Addon>
          <InputGroup.Input
            placeholder="e.g. foo.bar"
            value={item.key}
            onChange={(e) => handleChange('key', e.target.value)}
            disabled={disabled || item.isSystem}
            readOnly={readOnly}
            type="text"
            data-cy={`node-label-key-input_${index}`}
          />
        </InputGroup>
        {!!formikError?.key && <FormError>{formikError.key}</FormError>}
      </div>
      <div className="w-64 flex-none">
        <InputGroup
          size="small"
          className={clsx(item.needsDeletion && 'striked')}
        >
          <InputGroup.Addon>Value</InputGroup.Addon>
          <InputGroup.Input
            placeholder="e.g. true"
            value={item.value}
            onChange={(e) => handleChange('value', e.target.value)}
            disabled={disabled || item.isSystem}
            readOnly={readOnly}
            type="text"
            data-cy={`node-label-value-input_${index}`}
          />
        </InputGroup>
        {!!formikError?.value && <FormError>{formikError.value}</FormError>}
      </div>
      {item.isSystem && (
        <div className="flex flex-none items-center">
          <Badge type="info" className="my-auto">
            System
          </Badge>
        </div>
      )}
    </div>
  );

  function handleChange(key: keyof NodeLabel, value: string | number) {
    onChange({ ...item, [key]: value, isChanged: true });
  }
}
