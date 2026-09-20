import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import YAML from 'yaml';

import axios from '@/portainer/services/axios/axios';
import { notifySuccess } from '@/portainer/services/notifications';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { withError } from '@/react-tools/react-query';

import { Button, LoadingButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';
import { FormError } from '@@/form-components/FormError';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { PortainerSelect } from '@@/form-components/PortainerSelect';
import { InlineLoader } from '@@/InlineLoader';
import { PageHeader } from '@@/PageHeader';
import { TextTip } from '@@/Tip/TextTip';
import { usePreventExit, WebEditorForm } from '@@/WebEditorForm';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

import { appStackNameLabel } from '../constants';
import { queryKeys } from '../queries/query-keys';
import { useApplicationYAML } from '../DetailsView/AppYAMLEditor/useApplicationYAML';

const initialApplication = `apiVersion: apps/v1
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

export function ApplicationCreateView() {
  const environmentId = useEnvironmentId();
  const namespacesQuery = useNamespacesQuery(environmentId);
  const [namespace, setNamespace] = useState('');
  const [stackName, setStackName] = useState('');
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

  return (
    <ApplicationEditorForm
      environmentId={environmentId}
      isCreate
      namespace={selectedNamespace}
      sourceYaml={initialApplication}
      stackName={stackName}
      onStackNameChange={setStackName}
      namespaceControl={
        <FormControl
          label="Namespace"
          inputId="application-namespace"
          isLoading={namespacesQuery.isLoading}
        >
          <PortainerSelect
            value={selectedNamespace}
            options={namespaces.map((item) => ({
              label: item.Name,
              value: item.Name,
            }))}
            onChange={(value) => setNamespace(value || '')}
            inputId="application-namespace"
            data-cy="k8sAppCreate-nsSelect"
          />
        </FormControl>
      }
    />
  );
}

export function ApplicationEditView() {
  const environmentId = useEnvironmentId();
  const {
    params: { namespace, name },
  } = useCurrentStateAndParams();
  const { fullApplicationYaml, isApplicationYAMLLoading } =
    useApplicationYAML();

  if (isApplicationYAMLLoading || !fullApplicationYaml) {
    return <InlineLoader>Loading application manifest...</InlineLoader>;
  }

  return (
    <ApplicationEditorForm
      key={fullApplicationYaml}
      environmentId={environmentId}
      isCreate={false}
      namespace={String(namespace)}
      applicationName={String(name)}
      sourceYaml={fullApplicationYaml}
    />
  );
}

function ApplicationEditorForm({
  environmentId,
  isCreate,
  namespace,
  applicationName = '',
  sourceYaml,
  stackName = '',
  onStackNameChange,
  namespaceControl,
}: {
  environmentId: number;
  isCreate: boolean;
  namespace: string;
  applicationName?: string;
  sourceYaml: string;
  stackName?: string;
  onStackNameChange?(value: string): void;
  namespaceControl?: React.ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(sourceYaml);
  const [validationError, setValidationError] = useState('');
  const saveMutation = useMutation(save, {
    ...withError(
      isCreate ? 'Unable to deploy application' : 'Unable to update application'
    ),
    onSuccess: async (resources) => {
      await queryClient.invalidateQueries(
        queryKeys.applications(environmentId)
      );
      notifySuccess(
        'Success',
        isCreate
          ? 'Application successfully deployed'
          : 'Application successfully updated'
      );
      const primary = resources[0];
      router.stateService.go('kubernetes.applications.application', {
        namespace: primary.metadata.namespace,
        name: primary.metadata.name,
        'resource-type': primary.kind,
      });
    },
  });
  usePreventExit(sourceYaml, value, !saveMutation.isLoading);

  return (
    <>
      <PageHeader
        title={isCreate ? 'Create application' : 'Edit application'}
        breadcrumbs={
          isCreate
            ? [
                { label: 'Applications', link: 'kubernetes.applications' },
                'Create an application',
              ]
            : [
                { label: 'Namespaces', link: 'kubernetes.resourcePools' },
                {
                  label: namespace,
                  link: 'kubernetes.resourcePools.resourcePool',
                  linkParams: { id: namespace },
                },
                { label: 'Applications', link: 'kubernetes.applications' },
                {
                  label: applicationName,
                  link: 'kubernetes.applications.application',
                  linkParams: { name: applicationName, namespace },
                },
                'Edit',
              ]
        }
        reload
      />
      <div className="row kubernetes-create">
        <div className="col-xs-12">
          <Widget>
            <WidgetBody>
              <form
                className="form-horizontal mt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveMutation.mutate();
                }}
              >
                {namespaceControl}
                {isCreate && onStackNameChange && (
                  <FormControl label="Stack" inputId="application-stack-name">
                    <Input
                      id="application-stack-name"
                      value={stackName}
                      onChange={(event) =>
                        onStackNameChange(event.target.value)
                      }
                      placeholder="Optional stack group"
                      data-cy="k8sAppCreate-stackName"
                    />
                  </FormControl>
                )}

                <TextTip color="blue">
                  The manifest editor preserves the full Kubernetes API. Use
                  multiple YAML documents separated by <code>---</code> to
                  deploy related Services, autoscalers, ConfigMaps or Secrets
                  together.
                </TextTip>
                {!isCreate && (
                  <TextTip color="orange">
                    Changes made here update live resources. A GitOps controller
                    can overwrite them if this application is managed from Git.
                  </TextTip>
                )}
                <WebEditorForm
                  id="kubernetes-application-editor"
                  type="yaml"
                  value={value}
                  onChange={(nextValue) => {
                    setValue(nextValue);
                    setValidationError('');
                  }}
                  data-cy="k8sAppCreate-editor"
                  textTip="Define the application and any related Kubernetes resources."
                />
                {validationError && <FormError>{validationError}</FormError>}

                <FormSection title="Actions">
                  <LoadingButton
                    type="submit"
                    isLoading={saveMutation.isLoading}
                    loadingText={
                      isCreate
                        ? 'Deployment in progress...'
                        : 'Update in progress...'
                    }
                    disabled={!namespace || !value.trim()}
                    className="!ml-0"
                    data-cy="k8sAppCreate-deployButton"
                  >
                    {isCreate ? 'Deploy application' : 'Update application'}
                  </LoadingButton>
                  {!isCreate && (
                    <Button
                      color="default"
                      onClick={() =>
                        router.stateService.go(
                          'kubernetes.applications.application',
                          { namespace, name: applicationName }
                        )
                      }
                      data-cy="k8sAppCreate-appCancelButton"
                    >
                      Cancel
                    </Button>
                  )}
                </FormSection>
              </form>
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );

  async function save() {
    const resources = parseResources(value, namespace, stackName, isCreate);
    if (!resources.length) {
      const message = 'The manifest must contain at least one resource.';
      setValidationError(message);
      throw new Error(message);
    }

    await Promise.all(
      resources.map((resource) => {
        const path = resourcePath(resource);
        return isCreate
          ? axios.post(
              `/endpoints/${environmentId}/kubernetes/${path.collection}`,
              resource
            )
          : axios.put(
              `/endpoints/${environmentId}/kubernetes/${path.item}`,
              resource
            );
      })
    );
    return resources;
  }
}

type KubernetesResource = {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  spec?: {
    template?: { metadata?: { labels?: Record<string, string> } };
  };
};

function parseResources(
  value: string,
  fallbackNamespace: string,
  stackName: string,
  isCreate: boolean
) {
  return YAML.parseAllDocuments(value).map((document) => {
    if (document.errors.length) {
      throw new Error(document.errors[0].message);
    }
    const resource = document.toJSON() as KubernetesResource;
    if (!resource?.apiVersion || !resource.kind || !resource.metadata?.name) {
      throw new Error(
        'Every YAML document requires apiVersion, kind and metadata.name.'
      );
    }
    resource.metadata.namespace ||= fallbackNamespace;

    if (isCreate && stackName) {
      resource.metadata.labels = {
        ...resource.metadata.labels,
        [appStackNameLabel]: stackName,
      };
      if (resource.spec?.template) {
        resource.spec.template.metadata ||= {};
        resource.spec.template.metadata.labels = {
          ...resource.spec.template.metadata.labels,
          [appStackNameLabel]: stackName,
        };
      }
    }
    return resource;
  });
}

function resourcePath(resource: KubernetesResource) {
  const [group, version] = resource.apiVersion.includes('/')
    ? resource.apiVersion.split('/', 2)
    : ['', resource.apiVersion];
  const prefix = group ? `apis/${group}/${version}` : `api/${version}`;
  const plural = pluralForKind(resource.kind);
  const namespace = encodeURIComponent(resource.metadata.namespace || '');
  const name = encodeURIComponent(resource.metadata.name);
  const collection = `${prefix}/namespaces/${namespace}/${plural}`;
  return { collection, item: `${collection}/${name}` };
}

function pluralForKind(kind: string) {
  const overrides: Record<string, string> = {
    Endpoints: 'endpoints',
    Ingress: 'ingresses',
    NetworkPolicy: 'networkpolicies',
    PersistentVolumeClaim: 'persistentvolumeclaims',
    HorizontalPodAutoscaler: 'horizontalpodautoscalers',
  };
  return overrides[kind] || `${kind.toLowerCase()}s`;
}
