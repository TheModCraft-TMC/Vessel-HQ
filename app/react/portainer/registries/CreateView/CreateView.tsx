import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';
import { withError } from '@/react-tools/react-query';

import { BoxSelector } from '@@/BoxSelector';
import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { WidgetBody } from '@@/Widget/WidgetBody';

import { useRegistries } from '../queries/useRegistries';
import { queryKeys } from '../queries/query-keys';
import { createRegistry, RegistryPayload } from '../registry.service';
import { RegistryTypes } from '../types/registry';
import {
  defaultsForType,
  RegistryForm,
  RegistryFormValues,
} from '../RegistryForm';

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
      router.stateService.go('portainer.registries');
    },
  });

  return (
    <>
      <PageHeader
        title="Create registry"
        breadcrumbs={[
          { label: 'Registries', link: 'portainer.registries' },
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
            onCancel={() => router.stateService.go('portainer.registries')}
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
