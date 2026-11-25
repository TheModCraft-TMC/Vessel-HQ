import { useMutation } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';

import { withError } from '@/core/query';
import axios from '@/shared/http';
import { LoadingButton } from '@/ui/components/buttons';
import { confirm } from '@/ui/components/dialog/confirm';
import { buildConfirmButton } from '@/ui/components/dialog/utils';

import styles from './DownloadProjectButton.module.css';

export function DownloadProjectButton({ stackId }: { stackId: number }) {
  const download = useMutation({
    mutationFn: async () => {
      const { data } = await axios.get<Blob>(`/stacks/${stackId}/file`, {
        params: { format: 'project' },
        responseType: 'blob',
      });
      saveAs(data, `vessel-stack-${stackId}.zip`);
    },
    ...withError('Unable to export Compose project'),
  });

  return (
    <LoadingButton
      className={styles.root}
      type="button"
      size="small"
      color="default"
      icon={Download}
      isLoading={download.isLoading}
      loadingText="Exporting…"
      data-cy="stack-export-project"
      onClick={() => void handleDownload()}
    >
      Export Compose project
    </LoadingButton>
  );

  async function handleDownload() {
    if (
      await confirm({
        title: 'Export Compose project',
        message:
          'The archive contains the declared Compose files, including any literal secrets in their source. Stored environment values and credentials are excluded. Referenced directories, build contexts, includes and external resources must be supplied separately. Review the files and manifest before sharing or deploying.',
        confirmButton: buildConfirmButton('Download project'),
      })
    ) {
      download.mutate();
    }
  }
}
