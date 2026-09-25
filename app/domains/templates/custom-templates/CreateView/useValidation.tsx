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
import { file } from '@/ui/components/forms/yup-file-validation';

import {
  editor,
  git,
  upload,
} from '@@/BoxSelector/common-options/build-methods';

import { initialBuildMethods } from './types';

export function useValidation({
  viewType,
  deployMethod,
}: {
  viewType: 'kube' | 'docker' | 'edge';
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
        Method: string().oneOf(initialBuildMethods.map((m) => m.value)),
        FileContent: string().when('Method', {
          is: editor.value,
          then: (schema) => schema.required('Template is required.'),
        }),
        File: file().when('Method', {
          is: upload.value,
          then: (schema) => schema.required(),
        }),
        Git: mixed().when('Method', {
          is: git.value,
          then: () => buildGitValidationSchema(deployMethod),
        }),
        Variables: variablesValidation(),
        EdgeSettings: viewType === 'edge' ? edgeFieldsetValidation() : mixed(),
      }).concat(
        commonFieldsValidation({
          templates: customTemplatesQuery.data,
        })
      ),
    [customTemplatesQuery.data, viewType, deployMethod]
  );
}
