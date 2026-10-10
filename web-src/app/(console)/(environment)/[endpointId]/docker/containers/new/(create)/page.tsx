'use client';

import { useState } from 'react';
import { Formik } from 'formik';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import {
  useIsWindows,
  useSystemLimits,
} from '@/domains/containers/hooks/useDockerSystem';
import { useContainers } from '@/domains/containers/queries/useContainers';
import { CreateInnerForm } from '@/domains/containers/views/ContainerCreateView/CreateInnerForm';
import { toRequest } from '@/domains/containers/views/ContainerCreateView/toRequest';
import { useCreateOrReplaceMutation } from '@/domains/containers/views/ContainerCreateView/useCreateMutation';
import {
  useInitialValues,
  type Values,
} from '@/domains/containers/views/ContainerCreateView/useInitialValues';
import { useValidation } from '@/domains/containers/views/ContainerCreateView/validation';
import type { Registry } from '@/domains/registries';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useDebouncedValue } from '@/react/hooks/useDebouncedValue';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsEdgeAdmin, useIsEnvironmentAdmin } from '@/react/hooks/useUser';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { confirmDestructive } from '@/ui/components/dialog/confirm';
import { buildConfirmButton } from '@/ui/components/dialog/utils';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { PageHeader } from '@/ui/layouts/view-layout';

import { HelpLink } from '@@/HelpLink';
import type { ImageConfigValues } from '@@/ImageConfigFieldset';
import { InformationPanel } from '@@/InformationPanel';

export default function Page() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const pathname = usePathname();
  const isWindows = useIsWindows(environmentId);
  const isAdminQuery = useIsEdgeAdmin();
  const { authorized: isEnvironmentAdmin } = useIsEnvironmentAdmin();
  const [isDockerhubRateLimited, setIsDockerhubRateLimited] = useState(false);

  const mutation = useCreateOrReplaceMutation();
  const initialValuesQuery = useInitialValues(
    mutation.isLoading || mutation.isSuccess,
    isWindows
  );
  const registriesQuery = useEnvironmentRegistries(environmentId);
  const { oldContainer, syncName } = useOldContainer(
    initialValuesQuery?.initialValues?.name
  );
  const { maxCpu, maxMemory } = useSystemLimits(environmentId);
  const environmentQuery = useCurrentEnvironment();
  const validationSchema = useValidation({
    isAdmin: isAdminQuery.isAdmin,
    maxCpu,
    maxMemory,
    isDuplicating: initialValuesQuery?.isDuplicating,
    isDuplicatingPortainer: oldContainer?.IsPortainer,
    isDockerhubRateLimited,
  });

  if (!environmentQuery.data || !initialValuesQuery) {
    return null;
  }

  const environment = environmentQuery.data;
  const hideCapabilities =
    (!environment.SecuritySettings.allowContainerCapabilitiesForRegularUsers &&
      !isEnvironmentAdmin) ||
    isWindows;
  const {
    isDuplicating = false,
    initialValues,
    extraNetworks,
  } = initialValuesQuery;

  return (
    <>
      <PageHeader
        title="Create container"
        breadcrumbs={[
          { label: 'Containers', link: '/:endpointId/docker/containers' },
          'Add container',
        ]}
        reload
      />
      <>
        {isDuplicating && (
          <div className="row">
            <div className="col-sm-12">
              <InformationPanel title-text="Caution">
                <TextTip>
                  The new container may fail to start if the image is changed,
                  and settings from the previous container aren&apos;t
                  compatible. Common causes include entrypoint, cmd or{' '}
                  <HelpLink docLink="/user/docker/containers/advanced">
                    other settings
                  </HelpLink>{' '}
                  set by an image.
                </TextTip>
              </InformationPanel>
            </div>
          </div>
        )}

        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          validateOnMount
          validationSchema={validationSchema}
        >
          <CreateInnerForm
            hideCapabilities={hideCapabilities}
            onChangeName={syncName}
            isDuplicate={isDuplicating}
            isLoading={mutation.isLoading}
            onRateLimit={(limited = false) =>
              setIsDockerhubRateLimited(limited)
            }
          />
        </Formik>
      </>
    </>
  );

  async function handleSubmit(values: Values) {
    if (oldContainer) {
      const confirmed = await confirmDestructive({
        title: 'Are you sure?',
        message:
          'A container with the same name already exists. Vessel HQ can automatically remove it and re-create one. Do you want to replace it?',
        confirmButton: buildConfirmButton('Replace', 'danger'),
      });

      if (!confirmed) {
        return false;
      }
    }

    const registry = getRegistry(values.image, registriesQuery.data || []);
    const config = toRequest(values, registry, hideCapabilities);

    return mutation.mutate(
      {
        config,
        environment,
        values: {
          accessControl: values.accessControl,
          imageName: values.image.image,
          name: values.name,
          alwaysPull: values.alwaysPull,
          enableWebhook: values.enableWebhook,
          nodeName: values.nodeName,
        },
        registry,
        oldContainer,
        extraNetworks,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Container successfully created');
          router.push(
            buildHref('/:endpointId/docker/containers', {}, pathname)
          );
        },
      }
    );
  }
}

function getRegistry(image: ImageConfigValues, registries: Registry[]) {
  return image.useRegistry
    ? registries.find((registry) => registry.Id === image.registryId)
    : undefined;
}

function useOldContainer(initialName?: string) {
  const environmentId = useEnvironmentId();
  const [name, setName] = useState(initialName);
  const debouncedName = useDebouncedValue(name ?? initialName, 1000);
  const oldContainerQuery = useContainers(environmentId, {
    enabled: !!debouncedName,
    filters: { name: [`^/${debouncedName}$`] },
  });

  return {
    syncName: setName,
    oldContainer:
      oldContainerQuery.data && oldContainerQuery.data.length > 0
        ? oldContainerQuery.data[0]
        : undefined,
  };
}
