'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { withError } from '@/core/query';
import {
  RegistryForm,
  RegistryFormValues,
  valuesFromRegistry,
} from '@/domains/registries/components/RegistryForm';
import { queryKeys } from '@/domains/registries/queries/query-keys';
import { useRegistries } from '@/domains/registries/queries/useRegistries';
import { useRegistry } from '@/domains/registries/queries/useRegistry';
import { updateRegistry } from '@/domains/registries/services/registry.service';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

import { Widget, WidgetBody } from '@@/Widget';

import { toRegistryPayload } from './registryPayload';

export function RegistryDetailsHeader({ registryId }: { registryId: number }) {
  const registryQuery = useRegistry(registryId);

  return (
    <PageHeader
      title="Registry details"
      breadcrumbs={[
        { label: 'Registries', link: '/registries' },
        registryQuery.data?.Name || 'Registry',
      ]}
      reload
    />
  );
}

export function RegistryDetailsContent({ registryId }: { registryId: number }) {
  const registryQuery = useRegistry(registryId);
  const registriesQuery = useRegistries({ hideDefault: true });

  if (!registryQuery.data) return null;

  return (
    <EditRegistry
      key={registryQuery.data.Id}
      registryId={registryId}
      initialValues={valuesFromRegistry(registryQuery.data)}
      existingNames={(registriesQuery.data || [])
        .filter((registry) => registry.Id !== registryId)
        .map((registry) => registry.Name)}
    />
  );
}

function EditRegistry({
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
  const updateRegistryMutation = useMutation(
    () => updateRegistry(registryId, toRegistryPayload(values)),
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
    <Widget>
        <WidgetBody>
          <RegistryForm
            values={values}
            onChange={setValues}
            onSubmit={() => updateRegistryMutation.mutate()}
            onCancel={() => router.push('/registries')}
            isLoading={updateRegistryMutation.isLoading}
            existingNames={existingNames}
            isEdit
          />
        </WidgetBody>
      </Widget>
  );
}
