import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import stripAnsi from 'strip-ansi';
import uuidv4 from 'uuid/v4';

import { notifySuccess } from '@/ui/components/toast/notifications';
import {
  baseStackWebhookUrl,
  createWebhookId,
} from '@/portainer/helpers/webhookHelper';
import { useCreateStack, StackType } from '@/domains/stacks';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { K8sRegistryAccessNotice } from '@/domains/clusters';
import { useNamespacesQuery } from '@/domains/namespaces';
import { GitForm, validateGitForm } from '@/domains/gitops';
import { GitFormModel, getDefaultModel } from '@/domains/gitops';
import { CustomTemplatesVariablesField } from '@/domains/templates';
import {
  isTemplateVariablesEnabled,
  renderTemplate,
} from '@/domains/templates';
import { useCustomTemplate } from '@/domains/templates';
import { useCustomTemplateFile } from '@/domains/templates';
import { useTemplateInitialization } from '@/domains/stacks';
import { withError } from '@/core/query';
import { LoadingButton } from '@/ui/components/buttons';
import { FormControl } from '@/ui/components/forms/FormControl';
import { FormError } from '@/ui/components/forms/FormError';
import { FormSection } from '@/ui/components/forms/FormSection';
import { Input } from '@/ui/components/forms/Input';
import { PortainerSelect } from '@/ui/components/forms/PortainerSelect';
import { SwitchField } from '@/ui/components/forms/SwitchField';
import { InlineLoader } from '@/ui/components/feedback/InlineLoader';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { CustomTemplateSelector } from '@@/CustomTemplateSelector';
import {
  customTemplate,
  editor,
  git,
  url,
} from '@@/BoxSelector/common-options/build-methods';
import { BoxSelector, BoxSelectorOption } from '@@/BoxSelector';
import { usePreventExit, WebEditorForm } from '@@/WebEditorForm';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

import { getApplications } from '../applications/queries/useApplications';

import { StackName } from './StackName/StackName';
import { StackNameLabelInsight } from './StackName/StackNameLabelInsight';
import { KUBE_STACK_NAME_VALIDATION_REGEX } from './StackName/constants';

type Method = 'repository' | 'editor' | 'url' | 'template';

const methods: ReadonlyArray<BoxSelectorOption<Method>> = [
  git,
  editor,
  url,
  customTemplate,
];

const defaultManifest = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: example
spec:
  replicas: 1
  selector:
    matchLabels:
      app: example
  template:
    metadata:
      labels:
        app: example
    spec:
      containers:
        - name: example
          image: nginx:alpine
`;

export function DeployView() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const { params } = useCurrentStateAndParams();
  const createStackMutation = useCreateStack();
  const namespacesQuery = useNamespacesQuery(environmentId);
  const [method, setMethod] = useState<Method>(getInitialMethod(params));
  const [namespace, setNamespace] = useState('');
  const [useManifestNamespaces, setUseManifestNamespaces] = useState(false);
  const [stackName, setStackName] = useState('');
  const [editorContent, setEditorContent] = useState(defaultManifest);
  const [manifestUrl, setManifestUrl] = useState('');
  const [gitModel, setGitModel] = useState<GitFormModel>(() => ({
    ...getDefaultModel(),
    ComposeFilePathInRepository: 'manifest.yml',
  }));
  const [templateId, setTemplateId] = useState<number | undefined>(() => {
    const value = Number(params.templateId);
    return Number.isFinite(value) && value > 0 ? value : undefined;
  });
  const [templateContent, setTemplateContent] = useState('');
  const [templateVariables, setTemplateVariables] = useState<
    Array<{ key: string; value?: string }>
  >([]);
  const [errorLog, setErrorLog] = useState('');
  const [webhookId] = useState(() => createWebhookId() || uuidv4());

  const namespaces = useMemo(
    () =>
      (namespacesQuery.data || [])
        .filter((item) => !item.IsSystem)
        .sort((left, right) => {
          if (left.Name === 'default') return -1;
          if (right.Name === 'default') return 1;
          return left.Name.localeCompare(right.Name);
        }),
    [namespacesQuery.data]
  );
  const selectedNamespace = namespace || namespaces[0]?.Name || '';
  const applicationsQuery = useQuery(
    ['kubernetes-deploy-stack-names', environmentId, selectedNamespace],
    () => getApplications(environmentId, { namespace: selectedNamespace }),
    {
      enabled: !!selectedNamespace,
      ...withError('Unable to retrieve stack names'),
    }
  );
  const stackNames = useMemo(
    () =>
      Array.from(
        new Set(
          (applicationsQuery.data || [])
            .map((application) => application.StackName)
            .filter((value): value is string => !!value)
        )
      ),
    [applicationsQuery.data]
  );
  const stackNameError = getStackNameError(stackName);

  const selectedTemplateQuery = useCustomTemplate(templateId);
  const selectedTemplate = selectedTemplateQuery.data;
  const templateFileQuery = useCustomTemplateFile(
    templateId,
    !!selectedTemplate?.GitConfig
  );
  const templateFile = templateFileQuery.data || '';

  const handleTemplateVariablesChange = useCallback(
    (variables: Array<{ key: string; value?: string }>) => {
      setTemplateVariables(variables);
      if (selectedTemplate && templateFile) {
        setTemplateContent(
          renderTemplate(templateFile, variables, selectedTemplate.Variables)
        );
      }
    },
    [selectedTemplate, templateFile]
  );
  const handleTemplateContentChange = useCallback((value: string) => {
    setTemplateContent(value);
  }, []);

  useTemplateInitialization({
    selectedTemplate,
    templateFile,
    onVariablesChange: handleTemplateVariablesChange,
    onFileContentChange: handleTemplateContentChange,
  });
  usePreventExit(
    method === 'template' ? templateFile : defaultManifest,
    method === 'template' ? templateContent : editorContent,
    !createStackMutation.isLoading
  );

  const activeContent = method === 'template' ? templateContent : editorContent;
  const deployDisabled =
    createStackMutation.isLoading ||
    !!stackNameError ||
    (!useManifestNamespaces && !selectedNamespace) ||
    (method === 'editor' && !editorContent.trim()) ||
    (method === 'template' && (!templateId || !templateContent.trim())) ||
    (method === 'url' && !manifestUrl.trim()) ||
    (method === 'repository' &&
      (!gitModel.SourceId || !gitModel.ComposeFilePathInRepository));

  return (
    <>
      <PageHeader
        title="Create from code"
        breadcrumbs={['Deploy Kubernetes resources']}
        reload
      />
      <div className="row kubernetes-deploy">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <form className="form-horizontal" onSubmit={deploy}>
                <FormSection title="Deploy from">
                  <BoxSelector
                    slim
                    radioName="method"
                    value={method}
                    options={methods}
                    onChange={(value) => {
                      setMethod(value);
                      setErrorLog('');
                    }}
                    data-cy="k8sAppDeploy-buildSelector"
                  />
                </FormSection>

                <FormSection title="Deploy to">
                  <SwitchField
                    label="Use namespace(s) specified in manifest"
                    checked={useManifestNamespaces}
                    onChange={setUseManifestNamespaces}
                    tooltip="Use only the namespaces defined in the deployment manifest."
                    labelClass="col-lg-2 col-sm-3"
                    data-cy="use-namespace-from-manifest"
                  />

                  {!useManifestNamespaces ? (
                    <>
                      <K8sRegistryAccessNotice
                        namespace={selectedNamespace}
                        environmentId={environmentId}
                      />
                      <FormControl
                        label="Namespace"
                        inputId="namespace-selector"
                        isLoading={namespacesQuery.isLoading}
                      >
                        <PortainerSelect
                          value={selectedNamespace}
                          options={namespaces.map((item) => ({
                            label: item.Name,
                            value: item.Name,
                          }))}
                          onChange={(value) => setNamespace(value || '')}
                          inputId="namespace-selector"
                          data-cy="k8sAppDeploy-nsSelect"
                        />
                      </FormControl>
                    </>
                  ) : (
                    <FormControl label="Namespace">
                      <span className="small text-muted">
                        Namespaces specified in the manifest will be used.
                      </span>
                    </FormControl>
                  )}

                  <FormControl label="Name">
                    <span className="small text-muted">
                      Resource names specified in the manifest will be used.
                    </span>
                  </FormControl>

                  <div className="mb-4 w-fit">
                    <StackNameLabelInsight />
                  </div>
                  <StackName
                    stackName={stackName}
                    setStackName={setStackName}
                    stacks={stackNames}
                    error={stackNameError}
                  />
                </FormSection>

                {method === 'repository' && (
                  <GitForm
                    value={gitModel}
                    onChange={(value) =>
                      setGitModel((current) => ({ ...current, ...value }))
                    }
                    environmentType="KUBERNETES"
                    deployMethod="manifest"
                    isAdditionalFilesFieldVisible
                    isForcePullVisible={false}
                    baseWebhookUrl={baseStackWebhookUrl()}
                    webhookId={webhookId}
                    webhooksDocs="/user/kubernetes/applications/webhooks"
                  />
                )}

                {method === 'template' && (
                  <>
                    <FormSection title="Custom template">
                      <CustomTemplateSelector
                        value={templateId}
                        onChange={(value) => {
                          setTemplateId(value);
                          setTemplateContent('');
                          setTemplateVariables([]);
                        }}
                        stackType={StackType.Kubernetes}
                        newTemplatePath="kubernetes.templates.custom.new"
                      />
                      {!!templateId && templateFileQuery.isLoading && (
                        <InlineLoader>Loading template...</InlineLoader>
                      )}
                    </FormSection>
                    {isTemplateVariablesEnabled && selectedTemplate && (
                      <CustomTemplatesVariablesField
                        definitions={selectedTemplate.Variables}
                        value={templateVariables}
                        onChange={handleTemplateVariablesChange}
                      />
                    )}
                  </>
                )}

                {(method === 'editor' ||
                  (method === 'template' && !!templateId)) && (
                  <>
                    {useManifestNamespaces && (
                      <K8sRegistryAccessNotice
                        manifestContent={activeContent}
                        environmentId={environmentId}
                      />
                    )}
                    <WebEditorForm
                      id="kubernetes-deploy-editor"
                      type="yaml"
                      value={activeContent}
                      onChange={
                        method === 'template'
                          ? setTemplateContent
                          : setEditorContent
                      }
                      readonly={
                        method === 'template' && !!selectedTemplate?.GitConfig
                      }
                      data-cy="k8sAppDeploy-editor"
                      textTip="Define or paste the content of your Kubernetes manifest here."
                    >
                      <p>
                        Deploy any Kubernetes resource, including Deployments,
                        Services, Secrets and ConfigMaps.
                      </p>
                    </WebEditorForm>
                  </>
                )}

                {method === 'url' && (
                  <FormSection title="URL">
                    <FormControl label="URL" inputId="manifest_url" required>
                      <Input
                        id="manifest_url"
                        value={manifestUrl}
                        onChange={(event) => setManifestUrl(event.target.value)}
                        placeholder="https://example.com/manifest.yaml"
                        data-cy="k8sAppDeploy-urlFileUrl"
                      />
                    </FormControl>
                  </FormSection>
                )}

                {!!errorLog && (
                  <FormSection title="Deployment logs">
                    <TextTip color="red">
                      Kubernetes rejected one or more resources. Review the log
                      below, correct the manifest, and deploy again.
                    </TextTip>
                    <WebEditorForm
                      id="kubernetes-deploy-logs"
                      type="yaml"
                      value={errorLog}
                      onChange={() => undefined}
                      readonly
                      data-cy="kubernetes-deploy-error-logs"
                    />
                  </FormSection>
                )}

                <FormSection title="Actions">
                  {stackNameError && <FormError>{stackNameError}</FormError>}
                  <LoadingButton
                    type="submit"
                    loadingText="Deployment in progress..."
                    isLoading={createStackMutation.isLoading}
                    disabled={deployDisabled}
                    className="!ml-0"
                    data-cy="k8sAppDeploy-deployButton"
                  >
                    Deploy
                  </LoadingButton>
                </FormSection>
              </form>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );

  async function deploy(event: React.FormEvent) {
    event.preventDefault();
    setErrorLog('');

    if (method === 'repository') {
      const errors = await validateGitForm(gitModel, 'manifest');
      if (errors && Object.keys(errors).length) {
        setErrorLog('Complete all required Git repository fields.');
        return;
      }
    }

    const base = {
      name: stackName,
      environmentId,
      namespace: useManifestNamespaces ? '' : selectedNamespace,
      composeFormat: false,
    };

    const payload =
      method === 'repository'
        ? ({
            type: 'kubernetes',
            method: 'git',
            payload: { ...base, git: gitModel, webhook: webhookId },
          } as const)
        : method === 'url'
          ? ({
              type: 'kubernetes',
              method: 'url',
              payload: { ...base, manifestUrl },
            } as const)
          : ({
              type: 'kubernetes',
              method: 'string',
              payload: {
                ...base,
                fileContent:
                  method === 'template' ? templateContent : editorContent,
              },
            } as const);

    createStackMutation.mutate(payload, {
      onSuccess: () => {
        notifySuccess(
          'Success',
          'Request to deploy manifest successfully submitted'
        );
        const referrer = String(params.referrer || '');
        if (referrer) {
          router.stateService.go(
            referrer,
            params.tab ? { tab: params.tab } : {}
          );
        } else {
          router.stateService.go('kubernetes.applications');
        }
      },
      onError: (error) => {
        setErrorLog(extractErrorLog(error));
      },
    });
  }
}

function getInitialMethod(params: Record<string, unknown>): Method {
  if (params.templateId) {
    return 'template';
  }

  switch (Number(params.buildMethod)) {
    case 2:
      return 'editor';
    case 3:
      return 'template';
    case 4:
      return 'url';
    default:
      return 'repository';
  }
}

function getStackNameError(name: string) {
  if (!name || KUBE_STACK_NAME_VALIDATION_REGEX.test(name)) {
    return '';
  }
  return "Stack must consist of alphanumeric characters, '-', '_' or '.', must start and end with an alphanumeric character, and be 63 characters or less.";
}

function extractErrorLog(error: unknown) {
  const candidate = error as {
    message?: string;
    response?: { data?: { details?: string; message?: string } };
    err?: { data?: { details?: string } };
  };
  return stripAnsi(
    candidate.response?.data?.details ||
      candidate.err?.data?.details ||
      candidate.response?.data?.message ||
      candidate.message ||
      'Unable to deploy resources'
  );
}
