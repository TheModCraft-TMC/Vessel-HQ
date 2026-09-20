import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import YAML from 'yaml';

import { notifySuccess } from '@/portainer/services/notifications';
import axios from '@/portainer/services/axios/axios';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useNamespacesQuery } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
import { useResourceYAML } from '@/react/kubernetes/queries/useResourceYAML';
import { queryKeys } from '@/react/kubernetes/queries/query-keys';
import { withError } from '@/react-tools/react-query';

import { Button, LoadingButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { PageHeader } from '@@/PageHeader';
import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

type ResourceEditorConfig = {
  title: string;
  kind: 'ConfigMap' | 'Secret';
  plural: 'configmaps' | 'secrets';
  listRoute: string;
  isCreate?: boolean;
};

export function ResourceEditorView() {
  const environmentId = useEnvironmentId();
  const { state, params } = useCurrentStateAndParams();
  const config = state.data?.resourceEditorConfig as
    | ResourceEditorConfig
    | undefined;
  const namespace = String(params.namespace || '');
  const name = String(params.name || '');
  const resourcePath =
    config && namespace && name
      ? `api/v1/namespaces/${namespace}/${config.plural}/${name}`
      : '';
  const resourceQuery = useResourceYAML({
    environmentId,
    resourcePath,
    enabled: Boolean(config && !config.isCreate),
  });

  if (!config) {
    return null;
  }
  if (!config.isCreate && !resourceQuery.data) {
    return null;
  }

  return (
    <ResourceEditorForm
      key={`${config.kind}-${namespace}-${name}-${resourceQuery.data || 'new'}`}
      config={config}
      environmentId={environmentId}
      routeNamespace={namespace}
      routeName={name}
      sourceYaml={resourceQuery.data}
    />
  );
}

function ResourceEditorForm({
  config,
  environmentId,
  routeNamespace,
  routeName,
  sourceYaml,
}: {
  config: ResourceEditorConfig;
  environmentId: number;
  routeNamespace: string;
  routeName: string;
  sourceYaml?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const namespacesQuery = useNamespacesQuery(environmentId);
  const [namespace, setNamespace] = useState(routeNamespace);
  const [name, setName] = useState(routeName);
  const initialValue = useMemo(
    () =>
      sourceYaml ||
      YAML.stringify({
        apiVersion: 'v1',
        kind: config.kind,
        metadata: { name: '', namespace: '' },
        ...(config.kind === 'ConfigMap'
          ? { data: { 'example-key': 'example-value' } }
          : { type: 'Opaque', stringData: { 'example-key': 'example-value' } }),
      }),
    [config.kind, sourceYaml]
  );
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const defaultNamespace =
    namespacesQuery.data?.find((item) => !item.IsSystem)?.Name ||
    namespacesQuery.data?.[0]?.Name ||
    '';
  const selectedNamespace = namespace || defaultNamespace;
  const saveMutation = useMutation(save, {
    ...withError(`Unable to save ${config.kind}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.base(environmentId));
      notifySuccess('Success', `${config.kind} successfully saved`);
      router.stateService.go(config.listRoute);
    },
  });
  const deleteMutation = useMutation(remove, {
    ...withError(`Unable to remove ${config.kind}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.base(environmentId));
      notifySuccess('Success', `${config.kind} successfully removed`);
      router.stateService.go(config.listRoute);
    },
  });
  usePreventExit(initialValue, value, !saveMutation.isSuccess);

  return (
    <>
      <PageHeader
        title={config.title}
        breadcrumbs={[
          { label: 'Configurations', link: config.listRoute },
          config.isCreate ? `Add ${config.kind}` : routeName,
        ]}
        reload={!config.isCreate}
      />
      <Widget>
        <WidgetBody>
          <form
            className="form-horizontal"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            {config.isCreate && (
              <FormSection title={`${config.kind} details`}>
                <FormControl
                  label="Namespace"
                  inputId="resource-namespace"
                  required
                >
                  <select
                    id="resource-namespace"
                    className="form-control"
                    value={selectedNamespace}
                    onChange={(event) => setNamespace(event.target.value)}
                    data-cy="resource-namespace-select"
                  >
                    {(namespacesQuery.data || []).map((item) => (
                      <option key={item.Name} value={item.Name}>
                        {item.Name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormControl label="Name" inputId="resource-name" required>
                  <Input
                    id="resource-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={`e.g. my-${config.kind.toLowerCase()}`}
                    data-cy="resource-name-input"
                  />
                </FormControl>
              </FormSection>
            )}

            <WebEditorForm
              id={`${config.kind.toLowerCase()}-editor`}
              titleContent={`${config.kind} manifest`}
              value={value}
              onChange={(nextValue) => {
                setValue(nextValue);
                setError('');
              }}
              error={error}
              textTip={`Edit the complete Kubernetes ${config.kind} manifest.`}
              height="600px"
              data-cy={`${config.kind.toLowerCase()}-editor`}
            />

            <FormSection title="Actions">
              <div className="flex gap-2">
                <LoadingButton
                  isLoading={saveMutation.isLoading}
                  loadingText="Saving..."
                  disabled={
                    !selectedNamespace ||
                    !name ||
                    saveMutation.isLoading ||
                    (!config.isCreate && value === initialValue)
                  }
                  className="!ml-0"
                  data-cy="resource-save-button"
                >
                  {config.isCreate ? `Create ${config.kind}` : 'Apply changes'}
                </LoadingButton>
                <Button
                  color="default"
                  onClick={() => router.stateService.go(config.listRoute)}
                  data-cy="resource-cancel-button"
                >
                  Cancel
                </Button>
                {!config.isCreate && (
                  <DeleteButton
                    onConfirmed={() => deleteMutation.mutate()}
                    confirmMessage={`Are you sure you want to remove ${config.kind} ${routeName}?`}
                    disabled={deleteMutation.isLoading}
                    data-cy="resource-delete-button"
                  >
                    Remove
                  </DeleteButton>
                )}
              </div>
            </FormSection>
          </form>
        </WidgetBody>
      </Widget>
    </>
  );

  async function save() {
    try {
      const manifest = YAML.parse(value) as Record<string, unknown> | null;
      if (!manifest || typeof manifest !== 'object') {
        throw new Error('The manifest must be a YAML object.');
      }
      const metadata =
        manifest.metadata && typeof manifest.metadata === 'object'
          ? (manifest.metadata as Record<string, unknown>)
          : {};
      manifest.apiVersion = 'v1';
      manifest.kind = config.kind;
      manifest.metadata = {
        ...metadata,
        name: config.isCreate ? name : routeName,
        namespace: config.isCreate ? selectedNamespace : routeNamespace,
      };
      const baseUrl = `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${selectedNamespace}/${config.plural}`;
      if (config.isCreate) {
        await axios.post(baseUrl, manifest);
      } else {
        await axios.put(`${baseUrl}/${routeName}`, manifest);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw err;
    }
  }

  async function remove() {
    await axios.delete(
      `/endpoints/${environmentId}/kubernetes/api/v1/namespaces/${routeNamespace}/${config.plural}/${routeName}`
    );
  }
}
