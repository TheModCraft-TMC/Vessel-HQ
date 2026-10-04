import { useRouteParams } from '@console/console/routing/useRouteParams';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

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
  const pathname = usePathname();
  const { redirectTo = '' } = useRouteParams();
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
    router.push(buildHref(redirectTo || '/environments', {}, pathname));
  }
}
