import { Download, Upload } from 'lucide-react';
import _ from 'lodash';
import { Link } from '@console/navigation/Link';

import { Authorized } from '@/core/session/useUser';
import { notifyWarning } from '@/ui/components/toast/notifications';
import { Button, ButtonGroup, LoadingButton } from '@/ui/components/buttons';

import { ImagesListResponse } from '../../../queries/useImages';
import { useExportMutation } from '../../../queries/useExportImageMutation';
import { confirmImageExport } from '../../../components/common/ConfirmExportModal';

export function ImportExportButtons({
  selectedItems,
  confirmExport = confirmImageExport,
  notify = notifyWarning,
}: {
  selectedItems: Array<ImagesListResponse>;
  confirmExport?: typeof confirmImageExport;
  notify?: typeof notifyWarning;
}) {
  const exportMutation = useExportMutation();

  return (
    <ButtonGroup>
      <Authorized authorizations="DockerImageLoad">
        <Button
          size="small"
          color="light"
          as={Link}
          data-cy="image-importImageButton"
          icon={Upload}
          disabled={exportMutation.isLoading}
          props={{
            to: '/:endpointId/docker/images/import',
          }}
          aria-disabled={exportMutation.isLoading}
        >
          Import
        </Button>
      </Authorized>
      <Authorized authorizations="DockerImageGet">
        <LoadingButton
          size="small"
          color="light"
          icon={Download}
          isLoading={exportMutation.isLoading}
          loadingText="Export in progress..."
          data-cy="image-exportImageButton"
          onClick={() => handleExport()}
          disabled={selectedItems.length === 0}
        >
          Export
        </LoadingButton>
      </Authorized>
    </ButtonGroup>
  );

  async function handleExport() {
    if (!isValidToDownload(selectedItems, notify)) {
      return;
    }

    const confirmed = await confirmExport();

    if (!confirmed) {
      return;
    }

    exportMutation.mutate({
      images: selectedItems,
      nodeName: selectedItems[0].nodeName,
    });
  }
}

function isValidToDownload(
  selectedItems: Array<ImagesListResponse>,
  notify: typeof notifyWarning
) {
  for (let i = 0; i < selectedItems.length; i++) {
    const image = selectedItems[i];

    const untagged = image.tags?.find((item) => item.includes('<none>'));

    if (untagged) {
      notify('', 'Cannot download an untagged image');
      return false;
    }
  }

  if (_.uniqBy(selectedItems, 'nodeName').length > 1) {
    notify(
      '',
      'Cannot download images from different nodes at the same time'
    );
    return false;
  }

  return true;
}
