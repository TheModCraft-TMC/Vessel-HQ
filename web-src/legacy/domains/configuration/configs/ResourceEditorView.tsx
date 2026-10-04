import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { useRouteParams } from '@console/console/routing/useRouteParams';
import YAML from 'yaml';

import { notifySuccess } from '@/ui/components/toast/notifications';
import axios from '@/portainer/services/axios/axios';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useNamespacesQuery } from '@/domains/namespaces';
import {
  useResourceYAML,
  clusterQueryKeys as queryKeys,
} from '@/domains/clusters';
import { withError } from '@/core/query';
import { Button, LoadingButton } from '@/ui/components/buttons';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { FormControl } from '@/ui/components/forms/FormControl';
import { FormSection } from '@/ui/components/forms/FormSection';
import { Input } from '@/ui/components/forms/Input';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

import { WebEditorForm, usePreventExit } from '@@/WebEditorForm';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

export type ResourceEditorConfig = {
  title: string;
  kind: 'ConfigMap' | 'Secret';
  plural: 'configmaps' | 'secrets';
  listRoute: string;
  isCreate?: boolean;
};

export function ResourceEditorView({
  config,
}: {
  config: ResourceEditorConfig;
}) {
  return <ResourceEditorContent config={config} showHeader />;
}

export function ResourceEditorContent({
  config,
  showHeader = false,
}: {
  config: ResourceEditorConfig;
  showHeader?: boolean;
}) {
  const environmentId = useEnvironmentId();
  const params = useRouteParams();
  const namespace = String(params.namespace || '');
  const name = String(params.name || '');
  const resourcePath =
    namespace && name
      ? `api/v1/namespaces/${namespace}/${config.plural}/${name}`
      : '';
  const resourceQuery = useResourceYAML({
    environmentId,
    resourcePath,
    enabled: !config.isCreate,
  });

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
      showHeader={showHeader}
    />
  );
}

function ResourceEditorForm({
  config,
  environmentId,
  routeNamespace,
  routeName,
  sourceYaml,
  showHeader,
}: {
  config: ResourceEditorConfig;
  environmentId: number;
  routeNamespace: string;
  routeName: string;
  sourceYaml?: string;
  showHeader: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
      router.push(buildHref(config.listRoute, {}, pathname));
    },
  });
  const deleteMutation = useMutation(remove, {
    ...withError(`Unable to remove ${config.kind}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.base(environmentId));
      notifySuccess('Success', `${config.kind} successfully removed`);
      router.push(buildHref(config.listRoute, {}, pathname));
    },
  });
  usePreventExit(initialValue, value, !saveMutation.isSuccess);

  return (
    <>
      {showHeader && (
        <PageHeader
          title={config.title}
          breadcrumbs={[
            { label: 'Configurations', link: config.listRoute },
            config.isCreate ? `Add ${config.kind}` : routeName,
          ]}
          reload={!config.isCreate}
        />
      )}
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
                  onClick={() =>
                    router.push(buildHref(config.listRoute, {}, pathname))
                  }
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
