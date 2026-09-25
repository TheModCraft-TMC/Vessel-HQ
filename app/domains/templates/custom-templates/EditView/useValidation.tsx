import { mixed, number, object, string } from 'yup';
import { useMemo } from 'react';

import { StackType } from '@/domains/stacks';
import { validation as commonFieldsValidation } from '@/domains/templates';
import { Platform } from '@/domains/templates';
import { variablesValidation } from '@/domains/templates';
import { buildGitValidationSchema } from '@/domains/gitops';
import { useCustomTemplates } from '@/domains/templates';
import { edgeFieldsetValidation } from '@/domains/templates';
import { DeployMethod } from '@/domains/gitops';

import { CustomTemplate } from '../types';
import { TemplateViewType } from '../useViewType';

export function useValidation({
  isGit,
  templateId,
  viewType,
  deployMethod,
}: {
  isGit: boolean;
  templateId: CustomTemplate['Id'];
  viewType: TemplateViewType;
  deployMethod: DeployMethod;
}) {
  const customTemplatesQuery = useCustomTemplates({
    params: {
      edge: undefined,
    },
  });

  return useMemo(
    () =>
      object({
        Platform: number()
          .oneOf([Platform.LINUX, Platform.WINDOWS])
          .default(Platform.LINUX),
        Type: number()
          .oneOf([
            StackType.DockerCompose,
            StackType.DockerSwarm,
            StackType.Kubernetes,
          ])
          .default(StackType.DockerCompose),
        FileContent: string().required('Template is required.'),

        Git: isGit ? buildGitValidationSchema(deployMethod) : mixed(),
        Variables: variablesValidation(),
        EdgeSettings: viewType === 'edge' ? edgeFieldsetValidation() : mixed(),
      }).concat(
        commonFieldsValidation({
          templates: customTemplatesQuery.data,
          currentTemplateId: templateId,
        })
      ),
    [customTemplatesQuery.data, isGit, templateId, viewType, deployMethod]
  );
}
