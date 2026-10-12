import { useQuery } from '@tanstack/react-query';
import { Link } from '@console/navigation/Link';

import { error as notifyError } from '@/ui/components/toast/notifications';
import { getBackupStatus } from '@/core/backup/service';
import { isoDate } from '@/shared/formatters';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { InformationPanel } from '@/ui/components/feedback/InformationPanel';

import styles from './BackupFailedPanel.module.css';

export function BackupFailedPanel() {
  const { status, isLoading } = useBackupStatus();

  if (isLoading || !status || !status.Failed) {
    return null;
  }

  return (
    <div className={`${styles.root} row`}>
      <div className="col-sm-12">
        <InformationPanel title="Information">
          <TextTip>
            The latest automated backup has failed at{' '}
            {isoDate(status.TimestampUTC)}. For details please see the log files
            and have a look at the{' '}
            <Link to="/settings" data-cy="backup-failed-settings-link">
              settings
            </Link>{' '}
            to verify the backup configuration.
          </TextTip>
        </InformationPanel>
      </div>
    </div>
  );
}

function useBackupStatus() {
  const { data, isLoading } = useQuery(
    ['backup', 'status'],
    () => getBackupStatus(),
    {
      onError(error) {
        notifyError('Failure', error as Error, 'Failed to get license info');
      },
    }
  );

  return { status: data, isLoading };
}
