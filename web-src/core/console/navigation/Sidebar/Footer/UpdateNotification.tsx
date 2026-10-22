import clsx from 'clsx';
import { DownloadCloud } from 'lucide-react';
import {
  useLayoutActions,
  useLayoutSystem,
} from '@console/layout/LayoutContext';

import { Icon } from '@/ui/components/icons/Icon';

import styles from './UpdateNotification.module.css';

export function UpdateNotification() {
  const { version, dismissedUpdateVersion } = useLayoutSystem();
  const { dismissUpdate } = useLayoutActions();

  if (!version?.UpdateAvailable) {
    return null;
  }

  const { LatestVersion } = version;
  if (dismissedUpdateVersion && dismissedUpdateVersion === LatestVersion) {
    return null;
  }

  return (
    <div
      className={clsx(
        styles.root,
        'rounded-sm border bg-blue-11 py-2 th-dark:border-gray-warm-9 th-dark:bg-gray-warm-11',
        'border-blue-9'
      )}
    >
      <div className={clsx(styles.dismissTitle, 'vertical-center')}>
        <Icon icon={DownloadCloud} mode="primary" size="md" />
        <span className="space-left">
          New version available {LatestVersion}
        </span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={clsx(styles.dismissBtn, 'space-right')}
          onClick={() => dismissUpdate(LatestVersion)}
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
}
