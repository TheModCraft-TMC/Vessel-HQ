import { Formik } from 'formik';
import { useState, useMemo } from 'react';

import { toGitFormModel } from '@/domains/gitops';
import { getDefaultRelativePathModel } from '@/domains/gitops';
import { createWebhookId } from '@/portainer/helpers/webhookHelper';
import { CustomTemplate, getTemplateSourceId } from '@/domains/templates';
import { useCustomTemplate } from '@/domains/templates';
import { getVariablesFieldDefaultValues } from '@/domains/templates';
import { useAppTemplate } from '@/domains/templates';
import { TemplateViewModel } from '@/domains/templates';
import { getDefaultValues as getEnvVarDefaultValues } from '@/domains/templates';
import { parseAutoUpdateResponse } from '@/domains/gitops';
import { getDefaultStaggerConfig } from '@/domains/edge/models/stagger-config';
import { DeploymentType } from '@/domains/edge/models/edge-stack';

import { Widget } from '@@/Widget';

import { InnerForm } from './InnerForm';
import { useValidation } from './CreateForm.validation';
import { Values as TemplateValues } from './TemplateFieldset/types';
import { getInitialTemplateValues } from './TemplateFieldset/TemplateFieldset';
import { useTemplateParams } from './useTemplateParams';
import { useCreate } from './useCreate';
import { FormValues } from './types';

export function CreateForm() {
  const [webhookId] = useState(() => createWebhookId());

  const [templateParams, setTemplateParams] = useTemplateParams();
  const templateQuery = useTemplate(
    templateParams.templateType,
    templateParams.templateId
  );

  const validation = useValidation(templateQuery);
  const mutation = useCreate({
    webhookId,
    template: templateQuery.customTemplate || templateQuery.appTemplate,
    templateType: templateParams.templateType,
  });

  const initialValues = useInitialValues(templateQuery, templateParams);

  if (!initialValues) {
    return null;
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Body>
            <Formik
              initialValues={initialValues}
              onSubmit={mutation.onSubmit}
              validationSchema={validation}
              validateOnMount
            >
              <InnerForm
                webhookId={webhookId}
                isLoading={mutation.isLoading}
                onChangeTemplate={setTemplateParams}
              />
            </Formik>
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );
}

function getTemplateValues(
  type: 'custom' | 'app' | undefined,
  template: TemplateViewModel | CustomTemplate | undefined
): TemplateValues {
  if (!type || !template) {
    return getInitialTemplateValues();
  }

  if (type === 'custom') {
    const customTemplate = template as CustomTemplate;
    return {
      templateId: customTemplate.Id,
      type,
      variables: getVariablesFieldDefaultValues(customTemplate.Variables),
      envVars: {},
    };
  }

  const appTemplate = template as TemplateViewModel;

  return {
    templateId: appTemplate.Id,
    type,
    variables: [],
    envVars: getEnvVarDefaultValues(appTemplate.Env),
  };
}

function useTemplate(
  type: 'app' | 'custom' | undefined,
  id: number | undefined
) {
  const customTemplateQuery = useCustomTemplate(id, {
    enabled: type === 'custom',
  });
  const appTemplateQuery = useAppTemplate(id, {
    enabled: type === 'app',
  });

  return {
    appTemplate: type === 'app' ? appTemplateQuery.data : undefined,
    customTemplate: type === 'custom' ? customTemplateQuery.data : undefined,
  };
}

function useInitialValues(
  templateQuery: {
    appTemplate: TemplateViewModel | undefined;
    customTemplate: CustomTemplate | undefined;
  },
  templateParams: {
    templateId: number | undefined;
    templateType: 'app' | 'custom' | undefined;
  }
) {
  const template = templateQuery.customTemplate || templateQuery.appTemplate;
  const initialValues: FormValues = useMemo(
    () => ({
      name: '',
      groupIds: [],
      // if edge custom templates allow kube manifests/helm charts in future, add logic for setting this for the initial deploymentType
      deploymentType: DeploymentType.Compose,
      envVars: [],
      privateRegistryId:
        templateQuery.customTemplate?.EdgeSettings?.PrivateRegistryId ?? 0,
      prePullImage:
        templateQuery.customTemplate?.EdgeSettings?.PrePullImage ?? false,
      retryDeploy:
        templateQuery.customTemplate?.EdgeSettings?.RetryDeploy ?? false,
      staggerConfig:
        templateQuery.customTemplate?.EdgeSettings?.StaggerConfig ??
        getDefaultStaggerConfig(),
      method: templateParams.templateId ? 'template' : 'editor',
      git: toGitFormModel(
        getTemplateSourceId(templateQuery.customTemplate),
        templateQuery.customTemplate?.GitConfig,
        parseAutoUpdateResponse()
      ),
      relativePath:
        templateQuery.customTemplate?.EdgeSettings?.RelativePathSettings ??
        getDefaultRelativePathModel(),
      enableWebhook: false,
      fileContent: '',
      templateValues: getTemplateValues(templateParams.templateType, template),
      useManifestNamespaces: false,
    }),
    [
      templateQuery.customTemplate,
      templateParams.templateId,
      templateParams.templateType,
      template,
    ]
  );

  if (
    templateParams.templateId &&
    !templateQuery.customTemplate &&
    !templateQuery.appTemplate
  ) {
    return null;
  }

  return initialValues;
}
