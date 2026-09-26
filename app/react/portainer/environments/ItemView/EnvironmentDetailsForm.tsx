import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { notifySuccess } from '@/ui/components/toast/notifications';
import { Environment } from '@/domains/environments';
import { EdgeEnvironmentForm } from '@/domains/edge/views/environments/EdgeEnvironmentForm/EdgeEnvironmentForm';

import { isAzureEnvironment, isEdgeEnvironment } from '../utils';

import { AzureEnvironmentForm } from './AzureEnvironmentForm/AzureEnvironmentForm';
import { GeneralEnvironmentForm } from './GeneralEnvironmentForm/GeneralEnvironmentForm';

export function EnvironmentDetailsForm({
  environment,
}: {
  environment: Environment;
}) {
  const router = useRouter();
  const {
    params: { redirectTo = '' },
  } = useCurrentStateAndParams();
  const isAzure = isAzureEnvironment(environment.Type);
  const isEdge = isEdgeEnvironment(environment.Type);

  if (isAzure) {
    return (
      <AzureEnvironmentForm
        environment={environment}
        onSuccess={handleSuccess}
      />
    );
  }

  if (isEdge) {
    return (
      <EdgeEnvironmentForm
        environment={environment}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <GeneralEnvironmentForm
      environment={environment}
      onSuccess={handleSuccess}
    />
  );

  function handleSuccess() {
    notifySuccess('Environment updated', environment.Name);
    router.stateService.go(
      redirectTo || 'portainer.endpoints',
      {},
      { reload: true }
    );
  }
}
