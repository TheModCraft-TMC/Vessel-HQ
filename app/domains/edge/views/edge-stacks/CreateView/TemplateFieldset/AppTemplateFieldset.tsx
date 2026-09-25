import { FormikErrors } from 'formik';

import { TemplateViewModel } from '@/domains/templates';
import { useAppTemplate } from '@/domains/templates';
import { TemplateNote } from '@/domains/templates';
import { EnvVarsFieldset, EnvVarsValue } from '@/domains/templates';

export function AppTemplateFieldset({
  templateId,
  values,
  onChange,
  errors,
}: {
  templateId: TemplateViewModel['Id'];
  values: EnvVarsValue;
  onChange: (value: EnvVarsValue) => void;
  errors?: FormikErrors<EnvVarsValue>;
}) {
  const templateQuery = useAppTemplate(templateId);
  if (!templateQuery.data) {
    return null;
  }

  const template = templateQuery.data;

  return (
    <>
      <TemplateNote note={template.Note} />
      <EnvVarsFieldset
        options={template.Env || []}
        values={values}
        onChange={onChange}
        errors={errors}
      />
    </>
  );
}
