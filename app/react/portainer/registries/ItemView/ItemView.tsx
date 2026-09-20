import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { withError } from '@/react-tools/react-query';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

import { toPayload } from '../CreateView/CreateView';
import { queryKeys } from '../queries/query-keys';
import { useRegistries } from '../queries/useRegistries';
import { useRegistry } from '../queries/useRegistry';
import { updateRegistry } from '../registry.service';
import {
  RegistryForm,
  RegistryFormValues,
  valuesFromRegistry,
} from '../RegistryForm';

export function ItemView() {
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const registryId = Number(id);
  const registryQuery = useRegistry(registryId);
  const registriesQuery = useRegistries({ hideDefault: true });

  if (!registryQuery.data) {
    return null;
  }

  return (
    <EditRegistryForm
      key={registryQuery.data.Id}
      registryId={registryId}
      initialValues={valuesFromRegistry(registryQuery.data)}
      existingNames={(registriesQuery.data || [])
        .filter((registry) => registry.Id !== registryId)
        .map((registry) => registry.Name)}
    />
  );
}

function EditRegistryForm({
  registryId,
  initialValues,
  existingNames,
}: {
  registryId: number;
  initialValues: RegistryFormValues;
  existingNames: string[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [values, setValues] = useState(initialValues);
  const mutation = useMutation(
    () => updateRegistry(registryId, toPayload(values)),
    {
      ...withError('Unable to update registry'),
      onSuccess: async () => {
        await queryClient.invalidateQueries(queryKeys.base());
        notifySuccess('Success', 'Registry successfully updated');
        router.stateService.go('portainer.registries');
      },
    }
  );

  return (
    <>
      <PageHeader
        title="Registry details"
        breadcrumbs={[
          { label: 'Registries', link: 'portainer.registries' },
          initialValues.Name,
        ]}
        reload
      />
      <Widget>
        <WidgetBody>
          <RegistryForm
            values={values}
            onChange={setValues}
            onSubmit={() => mutation.mutate()}
            onCancel={() => router.stateService.go('portainer.registries')}
            isLoading={mutation.isLoading}
            existingNames={existingNames}
            isEdit
          />
        </WidgetBody>
      </Widget>
    </>
  );
}
