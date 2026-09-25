import { Formik } from 'formik';
import { useRouter } from '@uirouter/react';

import { ContainerInstanceFormValues } from '@/domains/azure/types';
import * as notifications from '@/ui/components/toast/notifications';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { validationSchema } from '@/domains/azure/components/ContainerInstances/CreateView/CreateContainerInstanceForm.validation';
import { useCreateInstanceMutation } from '@/domains/azure/queries/useCreateInstanceMutation';
import {
  useFormState,
  useLoadFormState,
} from '@/domains/azure/queries/useCreateFormState';
import { CreateContainerInstanceInnerForm } from '@/domains/azure/components/ContainerInstances/CreateView/CreateContainerInstanceInnerForm';

export function CreateContainerInstanceForm({
  defaultValues,
}: {
  defaultValues?: Partial<ContainerInstanceFormValues>;
}) {
  const environmentId = useEnvironmentId();
  const { isPureAdmin } = useCurrentUser();

  const { providers, subscriptions, resourceGroups, isLoading } =
    useLoadFormState(environmentId);

  const { initialValues, subscriptionOptions } = useFormState(
    subscriptions,
    resourceGroups,
    providers,
    defaultValues
  );

  const router = useRouter();

  const { mutateAsync } = useCreateInstanceMutation(
    resourceGroups,
    environmentId
  );

  if (isLoading) {
    return null;
  }

  return (
    <Formik<ContainerInstanceFormValues>
      initialValues={initialValues}
      validationSchema={() => validationSchema(isPureAdmin)}
      onSubmit={onSubmit}
      validateOnMount
      validateOnChange
      enableReinitialize
    >
      {(formikProps) => (
        <CreateContainerInstanceInnerForm
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...formikProps}
          subscriptionOptions={subscriptionOptions}
          environmentId={environmentId}
          resourceGroups={resourceGroups}
          providers={providers}
        />
      )}
    </Formik>
  );

  async function onSubmit(values: ContainerInstanceFormValues) {
    try {
      await mutateAsync(values);
      notifications.success('Container successfully created', values.name);
      router.stateService.go('azure.containerinstances');
    } catch (e) {
      notifications.error('Failure', e as Error, 'Unable to create container');
    }
  }
}
