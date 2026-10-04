import { RefreshCw } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import { EnvironmentId } from '@/domains/environments';
import { confirmContainerRecreation } from '@/domains/containers/components/ContainerDetails/ConfirmRecreationModal';
import { notifySuccess } from '@/ui/components/toast/notifications';
import { LoadingButton } from '@/ui/components/buttons';

import { ContainerId } from '../../../../types';
import { useRecreateContainer } from '../queries/useRecreateContainer';

interface RecreateButtonProps {
  environmentId: EnvironmentId;
  containerId: ContainerId;
  nodeName?: string;
  containerImage: string;
  isPortainer: boolean;
}

export function RecreateButton({
  environmentId,
  containerId,
  nodeName,
  containerImage,
  isPortainer,
}: RecreateButtonProps) {
  const recreateMutation = useRecreateContainer();
  const router = useRouter();
  const pathname = usePathname();

  async function handleRecreate() {
    const cannotPullImage =
      !containerImage || containerImage.toLowerCase().startsWith('sha256');

    const result = await confirmContainerRecreation(cannotPullImage);

    if (!result) {
      return;
    }

    recreateMutation.mutate(
      {
        environmentId,
        containerId,
        pullImage: result.pullLatest,
        nodeName,
      },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Container successfully re-created');
          router.push(
            buildHref('/:endpointId/docker/containers', {}, pathname)
          );
        },
      }
    );
  }

  return (
    <LoadingButton
      color="light"
      size="small"
      onClick={handleRecreate}
      disabled={isPortainer}
      isLoading={recreateMutation.isLoading}
      loadingText="Recreation in progress..."
      data-cy="recreate-container-button"
      icon={RefreshCw}
    >
      Recreate
    </LoadingButton>
  );
}
