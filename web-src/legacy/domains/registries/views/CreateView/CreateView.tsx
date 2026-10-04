import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { withError } from '@/core/query';
import { useRegistries } from '@/domains/registries/queries/useRegistries';
import { queryKeys } from '@/domains/registries/queries/query-keys';
import {
  createRegistry,
  RegistryPayload,
} from '@/domains/registries/services/registry.service';
import { RegistryTypes } from '@/domains/registries/models/registry';
import {
  defaultsForType,
  RegistryForm,
  RegistryFormValues,
} from '@/domains/registries/components/RegistryForm';
import { PageHeader } from '@/ui/layouts/view-layout';

import { WidgetBody } from '@@/Widget/WidgetBody';
import { Widget } from '@@/Widget';
import { BoxSelector } from '@@/BoxSelector';

import { options } from './options';

export function CreateView() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const registriesQuery = useRegistries({ hideDefault: true });
  const [values, setValues] = useState<RegistryFormValues>(() =>
    defaultsForType(RegistryTypes.DOCKERHUB)
  );
  const mutation = useMutation(() => createRegistry(toPayload(values)), {
    ...withError('Unable to create registry'),
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryKeys.base());
      notifySuccess('Success', 'Registry successfully created');
      router.push('/registries');
    },
  });

  return (
    <>
      <PageHeader
        title="Create registry"
        breadcrumbs={[
          { label: 'Registries', link: '/registries' },
          'Add registry',
        ]}
      />
      <Widget>
        <WidgetBody>
          <div className="form-horizontal">
            <div className="col-sm-12 form-section-title">
              Registry provider
            </div>
            <BoxSelector<string>
              radioName="registry-provider"
              value={String(values.Type)}
              onChange={(value) =>
                setValues(defaultsForType(Number(value) as RegistryTypes))
              }
              options={options}
            />
          </div>
          <RegistryForm
            values={values}
            onChange={setValues}
            onSubmit={() => mutation.mutate()}
            onCancel={() => router.push('/registries')}
            isLoading={mutation.isLoading}
            existingNames={(registriesQuery.data || []).map(
              (registry) => registry.Name
            )}
          />
        </WidgetBody>
      </Widget>
    </>
  );
}

export function toPayload(values: RegistryFormValues): RegistryPayload {
  const isHttp = /^http:\/\//i.test(values.URL);
  const cleanUrl = stripProtocolAndSlash(values.URL);
  return {
    Type: values.Type,
    Name: values.Name,
    URL: cleanUrl,
    BaseURL: stripProtocolAndSlash(values.BaseURL),
    Authentication: values.Authentication,
    Username: values.Authentication ? values.Username : '',
    Password: values.Authentication ? values.Password : '',
    TLS: !isHttp,
    Gitlab: values.Gitlab,
    Quay: values.Quay,
    Github: values.Github,
    Ecr: values.Ecr,
  };
}

function stripProtocolAndSlash(value: string) {
  return value.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}
