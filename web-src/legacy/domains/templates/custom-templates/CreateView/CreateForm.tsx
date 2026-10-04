import { Formik } from 'formik';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import { StackType } from '@/domains/stacks';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { useCreateTemplateMutation } from '@/domains/templates';
import { EnvironmentId } from '@/domains/environments';
import { useEnvironmentDeploymentOptions } from '@/react/portainer/environments/queries/useEnvironment';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { isKubernetesEnvironment } from '@/react/portainer/environments/utils';
import { DeployMethod } from '@/domains/gitops';

import { useInitialValues } from './useInitialValues';
import { FormValues, initialBuildMethods } from './types';
import { useValidation } from './useValidation';
import { InnerForm } from './InnerForm';

export function CreateForm({
  environmentId,
  viewType,
  defaultType,
}: {
  environmentId?: EnvironmentId;
  viewType: 'kube' | 'docker' | 'edge';
  defaultType: StackType;
}) {
  const deployMethod: DeployMethod =
    defaultType === StackType.Kubernetes ? 'manifest' : 'compose';
  const isEdge = !environmentId;
  const router = useRouter();
  const pathname = usePathname();
  const mutation = useCreateTemplateMutation();
  const validation = useValidation({ viewType, deployMethod });
  const buildMethods = useBuildMethods();

  const initialValues = useInitialValues({
    defaultType,
    isEdge,
    buildMethods: buildMethods.map((method) => method.value),
  });

  if (!initialValues) {
    return null;
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validation}
      validateOnMount
    >
      <InnerForm
        isLoading={mutation.isLoading}
        environmentId={environmentId}
        buildMethods={buildMethods}
      />
    </Formik>
  );

  function handleSubmit(values: FormValues) {
    mutation.mutate(
      {
        ...values,
        EdgeTemplate: isEdge,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Template created');
          router.push(buildHref('..', {}, pathname));
        },
      }
    );
  }
}

function useBuildMethods() {
  const environment = useCurrentEnvironment(false);

  const deploymentOptionsQuery = useEnvironmentDeploymentOptions(
    environment.data && isKubernetesEnvironment(environment.data.Type)
      ? environment.data.Id
      : undefined
  );
  return initialBuildMethods.filter((method) => {
    switch (method.value) {
      case 'editor':
        return !deploymentOptionsQuery.data?.hideWebEditor;
      case 'upload':
        return !deploymentOptionsQuery.data?.hideFileUpload;
      case 'repository':
        return true;
      default:
        return true;
    }
  });
}
