import { SetStateAction, useEffect, useState } from 'react';

import { renderTemplate } from '@/domains/templates';
import { useAppTemplate } from '@/domains/templates';
import { useAppTemplateFile } from '@/domains/templates';
import { TemplateViewModel } from '@/domains/templates';
import { getDefaultStaggerConfig } from '@/domains/edge/models/stagger-config';
import { DeploymentType } from '@/domains/edge/models/edge-stack';

import { DockerFormValues, FormValues } from './types';

/**
 * useRenderAppTemplate fetches the app template (file and data) and returns it
 * as a TemplateViewModel.
 *
 * It also renders the template file and updates the form values.
 */
export function useRenderAppTemplate(
  templateValues: DockerFormValues['templateValues'],
  setValues: (values: SetStateAction<DockerFormValues>) => void
) {
  const templateQuery = useAppTemplate(templateValues.templateId, {
    enabled: templateValues.type === 'app',
  });

  const template = templateQuery.data;

  const templateFileQuery = useAppTemplateFile(templateValues.templateId, {
    enabled: templateValues.type === 'app',
  });

  const [currentTemplateId, setCurrentTemplateId] = useState<
    number | undefined
  >(templateValues.templateId);

  useEffect(() => {
    if (templateValues.type === 'app' && templateFileQuery.data) {
      const newTemplateValues = getValuesFromAppTemplate(template);
      const newFile = renderTemplate(
        templateFileQuery.data,
        templateValues.variables,
        []
      );

      setCurrentTemplateId(template?.Id);
      setValues((values) => ({
        ...values,
        ...newTemplateValues,
        fileContent: newFile,
      }));
    }
  }, [
    currentTemplateId,
    setValues,
    template,
    templateFileQuery.data,
    templateFileQuery.isInitialLoading,
    templateValues.type,
    templateValues.variables,
  ]);

  return {
    appTemplate: template,
    isInitialLoading:
      templateQuery.isInitialLoading || templateFileQuery.isInitialLoading,
  };
}

function getValuesFromAppTemplate(
  template: TemplateViewModel | undefined
): Partial<FormValues> {
  if (!template) {
    return {};
  }

  return {
    deploymentType: DeploymentType.Compose,
    ...(template
      ? {
          prePullImage: false,
          retryDeploy: false,
          staggerConfig: getDefaultStaggerConfig(),
        }
      : {}),
  };
}
