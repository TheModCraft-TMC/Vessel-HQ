import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { useIdParam } from '@/react/hooks/useIdParam';
import { withError } from '@/core/query';
import { queryKeys } from '@/domains/registries/queries/query-keys';
import { useRegistries } from '@/domains/registries/queries/useRegistries';
import { useRegistry } from '@/domains/registries/queries/useRegistry';
import { updateRegistry } from '@/domains/registries/services/registry.service';
import {
  RegistryForm,
  RegistryFormValues,
  valuesFromRegistry,
} from '@/domains/registries/components/RegistryForm';
import { PageHeader } from '@/ui/layouts/view-layout';

import { WidgetBody } from '@@/Widget/WidgetBody';
import { Widget } from '@@/Widget';

import { toPayload } from '../CreateView/CreateView';

export function ItemView() {
  const registryId = useIdParam();
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
        router.push('/registries');
      },
    }
  );

  return (
    <>
      <PageHeader
        title="Registry details"
        breadcrumbs={[
          { label: 'Registries', link: '/registries' },
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
            onCancel={() => router.push('/registries')}
            isLoading={mutation.isLoading}
            existingNames={existingNames}
            isEdit
          />
        </WidgetBody>
      </Widget>
    </>
  );
}
