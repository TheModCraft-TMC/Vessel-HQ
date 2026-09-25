import { SetStateAction } from 'react';
import { FormikErrors } from 'formik';

import { getVariablesFieldDefaultValues } from '@/domains/templates';
import { TemplateViewModel } from '@/domains/templates';
import { CustomTemplate } from '@/domains/templates';
import { getAppVariablesDefaultValues } from '@/domains/templates';

import { TemplateSelector } from './TemplateSelector';
import { Values } from './types';
import { CustomTemplateFieldset } from './CustomTemplateFieldset';
import { AppTemplateFieldset } from './AppTemplateFieldset';

export function TemplateFieldset({
  values,
  setValues,
  errors,
  isLoadingValues,
}: {
  errors?: FormikErrors<Values>;
  values: Values;
  setValues: (values: SetStateAction<Values>) => void;
  isLoadingValues?: boolean;
}) {
  return (
    <>
      <TemplateSelector
        error={errors?.templateId}
        value={values}
        onChange={handleChangeTemplate}
        isLoadingValues={isLoadingValues}
      />
      {values.templateId && !isLoadingValues && (
        <>
          {values.type === 'custom' && (
            <CustomTemplateFieldset
              templateId={values.templateId}
              values={values.variables}
              onChange={(variables) =>
                setValues((values) => ({ ...values, variables }))
              }
              errors={errors?.variables}
            />
          )}

          {values.type === 'app' && (
            <AppTemplateFieldset
              templateId={values.templateId}
              values={values.envVars}
              onChange={(envVars) =>
                setValues((values) => ({ ...values, envVars }))
              }
              errors={errors?.envVars}
            />
          )}
        </>
      )}
    </>
  );

  function handleChangeTemplate(
    template: TemplateViewModel | CustomTemplate | undefined,
    type: 'app' | 'custom' | undefined
  ): void {
    setValues(() => {
      if (!template || !type) {
        return {
          type: undefined,
          templateId: undefined,
          variables: [],
          envVars: {},
        };
      }

      if (type === 'app') {
        return {
          templateId: template.Id,
          type,
          variables: [],
          envVars: getAppVariablesDefaultValues(
            (template as TemplateViewModel).Env || []
          ),
        };
      }

      return {
        templateId: template.Id,
        type,
        variables: getVariablesFieldDefaultValues(
          (template as CustomTemplate).Variables || []
        ),
        envVars: {},
      };
    });
  }
}

export function getInitialTemplateValues(): Values {
  return {
    templateId: undefined,
    type: undefined,
    variables: [],
    envVars: {},
  };
}
