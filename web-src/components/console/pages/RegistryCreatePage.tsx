'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { withError } from '@/core/query';
import {
  defaultsForType,
  RegistryForm,
  RegistryFormValues,
} from '@/domains/registries/components/RegistryForm';
import { RegistryTypes } from '@/domains/registries/models/registry';
import { queryKeys } from '@/domains/registries/queries/query-keys';
import { useRegistries } from '@/domains/registries/queries/useRegistries';
import { createRegistry } from '@/domains/registries/services/registry.service';
import { options } from '@/domains/registries/views/CreateView/options';
import { notifySuccess } from '@/ui/components/toast/notifications';

import { BoxSelector } from '@@/BoxSelector';
import { Widget, WidgetBody } from '@@/Widget';

import { toRegistryPayload } from './registryPayload';

export function RegistryCreateContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const registriesQuery = useRegistries({ hideDefault: true });
  const [values, setValues] = useState<RegistryFormValues>(() =>
    defaultsForType(RegistryTypes.DOCKERHUB)
  );
  const createRegistryMutation = useMutation(
    () => createRegistry(toRegistryPayload(values)),
    {
      ...withError('Unable to create registry'),
      onSuccess: async () => {
        await queryClient.invalidateQueries(queryKeys.base());
        notifySuccess('Success', 'Registry successfully created');
        router.push('/registries');
      },
    }
  );

  return (
    <Widget>
        <WidgetBody>
          <RegistryProviderSelector values={values} onChange={setValues} />
          <RegistryForm
            values={values}
            onChange={setValues}
            onSubmit={() => createRegistryMutation.mutate()}
            onCancel={() => router.push('/registries')}
            isLoading={createRegistryMutation.isLoading}
            existingNames={(registriesQuery.data || []).map(
              (registry) => registry.Name
            )}
          />
        </WidgetBody>
      </Widget>
  );
}

function RegistryProviderSelector({
  values,
  onChange,
}: {
  values: RegistryFormValues;
  onChange(values: RegistryFormValues): void;
}) {
  return (
    <div className="form-horizontal">
      <div className="col-sm-12 form-section-title">Registry provider</div>
      <BoxSelector<string>
        radioName="registry-provider"
        value={String(values.Type)}
        onChange={(value) =>
          onChange(defaultsForType(Number(value) as RegistryTypes))
        }
        options={options}
      />
    </div>
  );
}
