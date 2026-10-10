import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import { EnvironmentId } from '@/domains/environments';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { useUninstallHelmAppMutation } from '@/domains/configuration/helm/helmReleaseQueries/useUninstallHelmAppMutation';

export function UninstallButton({
  environmentId,
  releaseName,
  namespace,
}: {
  environmentId: EnvironmentId;
  releaseName: string;
  namespace?: string;
}) {
  const uninstallHelmAppMutation = useUninstallHelmAppMutation(environmentId);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <DeleteButton
      size="medium"
      data-cy="k8sApp-removeHelmChartButton"
      isLoading={uninstallHelmAppMutation.isLoading}
      confirmMessage="Do you want to remove the selected Helm chart? This will delete all resources associated with the Helm chart."
      onConfirmed={handleUninstall}
    >
      Uninstall
    </DeleteButton>
  );

  function handleUninstall() {
    uninstallHelmAppMutation.mutate(
      { releaseName, namespace },
      {
        onSuccess: () => {
          router.push(
            buildHref(
              '/:endpointId/kubernetes/applications',
              {
                endpointId: environmentId,
              },
              pathname
            )
          );
          notifySuccess('Success', 'Helm chart uninstalled successfully');
        },
      }
    );
  }
}
