import clsx from 'clsx';
import { Settings } from 'lucide-react';

import { Icon } from '@/ui/components/icons/Icon';

import styles from './EdgeLoadingSpinner.module.css';

export function EdgeLoadingSpinner() {
  return (
    <div className={clsx('row', styles.root)}>
      Connecting to the Edge environment...
      <Icon icon={Settings} className="!ml-1 animate-spin-slow" />
    </div>
  );
}
