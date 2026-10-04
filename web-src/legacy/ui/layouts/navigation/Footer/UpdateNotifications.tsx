import clsx from 'clsx';
import { DownloadCloud } from 'lucide-react';

import { Icon } from '@/ui/components/icons/Icon';
import { useLayoutBindings } from '@/ui/layouts/layout-context';

import styles from './UpdateNotifications.module.css';

export function UpdateNotification() {
  const { version, dismissedUpdateVersion, dismissUpdate } =
    useLayoutBindings();

  if (!version || !version.UpdateAvailable) {
    return null;
  }

  const { LatestVersion } = version;

  if (
    !!dismissedUpdateVersion &&
    LatestVersion?.length > 0 &&
    dismissedUpdateVersion === LatestVersion
  ) {
    return null;
  }

  return (
    <div
      className={clsx(
        styles.root,
        'rounded border py-2',
        'bg-blue-11 th-dark:bg-gray-warm-11',
        'border-blue-9 th-dark:border-gray-warm-9'
      )}
    >
      <div className={clsx(styles.dismissTitle, 'vertical-center')}>
        <Icon icon={DownloadCloud} mode="primary" size="md" />
        <span className="space-left">
          New version available {LatestVersion}
        </span>
      </div>

      <div className={clsx(styles.actions)}>
        <button
          type="button"
          className={clsx(styles.dismissBtn, 'space-right')}
          onClick={() => onDismiss(LatestVersion)}
        >
          Dismiss
        </button>
        <a
          className="hyperlink space-left"
          target="_blank"
          href={`https://hub.docker.com/r/themodcrafttmc/portainer/tags?name=${LatestVersion}`}
          rel="noreferrer"
        >
          See what&apos;s new
        </a>
      </div>
    </div>
  );

  function onDismiss(version: string) {
    dismissUpdate(version);
  }
}
