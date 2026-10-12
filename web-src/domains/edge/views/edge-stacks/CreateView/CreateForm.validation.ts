import {
  SchemaOf,
  array,
  boolean,
  lazy,
  mixed,
  number,
  object,
  string,
} from 'yup';
import { useMemo } from 'react';
import Lazy from 'yup/lib/Lazy';

import { buildGitValidationSchema } from '@/domains/gitops';
import { relativePathValidation } from '@/domains/gitops';
import { CustomTemplate } from '@/domains/templates';
import { TemplateViewModel } from '@/domains/templates';
import {
  DeployMethod,
  GitFormModel,
  RelativePathModel,
} from '@/domains/gitops';
import { EnvironmentType } from '@/domains/environments';
import { envVarValidation } from '@/ui/components/forms/EnvironmentVariablesFieldset';
import { file } from '@/ui/components/forms/yup-file-validation';
import { DeploymentType } from '@/domains/edge/models/edge-stack';
import { useEdgeGroups } from '@/domains/edge/queries/edge-groups/useEdgeGroups';

import { staggerConfigValidation } from '../components/StaggerFieldset';
import { createHasEnvironmentTypeFunction } from '../ItemView/EditEdgeStackForm/useEdgeGroupHasType';

import { FormValues, Method } from './types';
import { templateFieldsetValidation } from './TemplateFieldset/validation';
import { useNameValidation } from './NameField';

export function useValidation({
  appTemplate,
  customTemplate,
}: {
  appTemplate: TemplateViewModel | undefined;
  customTemplate: CustomTemplate | undefined;
}): Lazy<SchemaOf<FormValues>> {
  const nameValidation = useNameValidation();
  const edgeGroupsQuery = useEdgeGroups();
  const edgeGroups = edgeGroupsQuery.data;

  return useMemo(
    () =>
      lazy((values: FormValues) =>
        object({
          method: mixed<Method>()
            .oneOf(['editor', 'upload', 'repository', 'template'])
            .required(),
          name: nameValidation(values.groupIds),
          groupIds: array(number().required())
            .required()
            .min(1, 'At least one Edge group is required'),
          deploymentType: mixed<DeploymentType>()
            .oneOf([DeploymentType.Compose, DeploymentType.Kubernetes])
            .required()
            .test(
              'kubernetes-deployment-type-validation',
              'Kubernetes deployment type is not compatible with the selected edge group(s), which contain Docker environments',
              (value) => {
                if (value !== DeploymentType.Kubernetes) {
                  return true;
                }

                const hasType = createHasEnvironmentTypeFunction(
                  values.groupIds,
                  edgeGroups
                );

                const hasDockerEndpoint = hasType(
                  EnvironmentType.EdgeAgentOnDocker
                );

                return !hasDockerEndpoint;
              }
            )
            .test(
              'compose-deployment-type-validation',
              'Compose deployment type is not compatible with the selected edge group(s), which contain Kubernetes environments',
              (value) => {
                if (value !== DeploymentType.Compose) {
                  return true;
                }

                const hasType = createHasEnvironmentTypeFunction(
                  values.groupIds,
                  edgeGroups
                );

                const hasKubeEndpoint = hasType(
                  EnvironmentType.EdgeAgentOnKubernetes
                );

                return !hasKubeEndpoint;
              }
            ),
          envVars: envVarValidation(),
          privateRegistryId: number().default(0),
          prePullImage: boolean().default(false),
          retryDeploy: boolean().default(false),
          enableWebhook: boolean().default(false),
          staggerConfig: staggerConfigValidation(),
          fileContent: string()
            .default('')
            .when('method', {
              is: 'editor',
              then: (schema) => schema.required('Config file is required'),
            }),
          file: file().when('method', {
            is: 'upload',
            then: (schema) => schema.required(),
          }),
          templateValues: templateFieldsetValidation({
            customVariablesDefinitions: customTemplate?.Variables || [],
            appTemplateVariablesDefinitions: appTemplate?.Env || [],
          }),
          git: mixed().when('method', {
            is: 'repository',
            then: () => {
              const deploymentMethod: DeployMethod =
                values.deploymentType === DeploymentType.Compose
                  ? 'compose'
                  : 'manifest';
              return buildGitValidationSchema(deploymentMethod);
            },
          }) as SchemaOf<GitFormModel>,
          relativePath: mixed().when('method', {
            is: 'repository',
            then: () => relativePathValidation(),
          }) as SchemaOf<RelativePathModel>,
          useManifestNamespaces: boolean().default(false),
        })
      ),
    [appTemplate?.Env, customTemplate, edgeGroups, nameValidation]
  );
}
