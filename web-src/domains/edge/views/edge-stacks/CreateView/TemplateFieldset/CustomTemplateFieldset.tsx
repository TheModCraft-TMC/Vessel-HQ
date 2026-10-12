import { CustomTemplatesVariablesField } from '@/domains/templates';
import { CustomTemplate } from '@/domains/templates';
import { TemplateNote } from '@/domains/templates';
import { useCustomTemplate } from '@/domains/templates';
import { ArrayError } from '@/ui/components/forms/InputList/InputList';

import { Values } from './types';

export function CustomTemplateFieldset({
  errors,
  onChange,
  values,
  templateId,
}: {
  values: Values['variables'];
  onChange: (values: Values['variables']) => void;
  errors: ArrayError<Values['variables']> | undefined;
  templateId: CustomTemplate['Id'];
}) {
  const templateQuery = useCustomTemplate(templateId);

  if (!templateQuery.data) {
    return null;
  }

  const template = templateQuery.data;

  return (
    <>
      <TemplateNote note={template.Note} />

      <CustomTemplatesVariablesField
        onChange={onChange}
        value={values}
        definitions={template.Variables}
        errors={errors}
      />
    </>
  );
}
