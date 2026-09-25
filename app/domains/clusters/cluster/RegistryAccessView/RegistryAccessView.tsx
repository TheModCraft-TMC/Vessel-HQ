import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams } from '@uirouter/react';
import { Database, UserX } from 'lucide-react';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useNamespacesQuery } from '@/domains/namespaces';
import { updateEnvironmentRegistryAccess } from '@/react/portainer/environments/environment.service/registries';
import { useRegistry, registryQueryKeys } from '@/domains/registries';
import { withError } from '@/core/query';
import { LoadingButton } from '@/ui/components/buttons';
import { FormSection } from '@/ui/components/forms/FormSection';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { TableContainer, TableTitle } from '@/ui/components/data-table';

import { DetailsTable } from '@@/DetailsTable';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

import { AccessTable } from './AccessTable';
import { NamespacesSelector } from './NamespacesSelector';

export function RegistryAccessView() {
  const environmentId = useEnvironmentId();
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const registryId = Number(id);
  const registryQuery = useRegistry(registryId);
  const namespacesQuery = useNamespacesQuery(environmentId);
  const queryClient = useQueryClient();
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);
  const savedNamespaces = useMemo(
    () =>
      registryQuery.data?.RegistryAccesses?.[environmentId]?.Namespaces || [],
    [environmentId, registryQuery.data]
  );
  const availableNamespaces = (namespacesQuery.data || [])
    .filter(
      (namespace) =>
        !namespace.IsSystem && !savedNamespaces.includes(namespace.Name)
    )
    .map((namespace) => ({ id: namespace.Id, name: namespace.Name }));
  const mutation = useMutation(
    (namespaces: string[]) =>
      updateEnvironmentRegistryAccess(environmentId, registryId, {
        Namespaces: namespaces,
      }),
    {
      ...withError('Failed saving registry access'),
      onSuccess: async () => {
        await queryClient.invalidateQueries(registryQueryKeys.item(registryId));
        setSelectedNamespaces([]);
        notifySuccess('Success', 'Registry access updated');
      },
    }
  );

  if (!registryQuery.data) {
    return null;
  }
  const registry = registryQuery.data;

  return (
    <>
      <PageHeader
        title="Registry access"
        breadcrumbs={[
          { label: 'Registries', link: 'kubernetes.registries' },
          registry.Name,
          'Access management',
        ]}
        reload
      />

      <TableContainer>
        <TableTitle label="Registry details" icon={Database} />
        <DetailsTable dataCy="registry-access-details">
          <DetailsTable.Row label="Name">{registry.Name}</DetailsTable.Row>
          <DetailsTable.Row label="URL">{registry.URL}</DetailsTable.Row>
          <DetailsTable.Row label="Authentication">
            {registry.Authentication ? 'Enabled' : 'Disabled'}
          </DetailsTable.Row>
        </DetailsTable>
      </TableContainer>

      <Widget>
        <Widget.Title title="Create access" icon={UserX} />
        <WidgetBody>
          <form
            className="form-horizontal"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate([...savedNamespaces, ...selectedNamespaces]);
            }}
          >
            <FormSection title="Namespaces">
              {availableNamespaces.length ? (
                <NamespacesSelector
                  value={selectedNamespaces}
                  onChange={setSelectedNamespaces}
                  namespaces={availableNamespaces}
                  dataCy="registry-access-namespace-selector"
                  placeholder="Select one or more namespaces"
                  allowSelectAll
                />
              ) : (
                <span className="text-muted">No namespaces available.</span>
              )}
              <TextTip color="orange">
                Adding this registry exposes its credentials to all users of the
                selected namespace.
              </TextTip>
            </FormSection>
            <FormSection title="Actions">
              <LoadingButton
                isLoading={mutation.isLoading}
                loadingText="Creating access..."
                disabled={!selectedNamespaces.length || mutation.isLoading}
                className="!ml-0"
                data-cy="create-registry-access-button"
              >
                Create access
              </LoadingButton>
            </FormSection>
          </form>
        </WidgetBody>
      </Widget>

      <AccessTable
        dataset={savedNamespaces.map((value) => ({ value }))}
        onRemove={(items) => {
          const removed = new Set(items.map((item) => item.value));
          mutation.mutate(
            savedNamespaces.filter((namespace) => !removed.has(namespace))
          );
        }}
      />
    </>
  );
}
