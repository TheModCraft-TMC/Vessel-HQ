import { LayoutGrid } from 'lucide-react';

import styles from './EnvironmentGroupName.module.css';

export function EnvironmentGroupName({ groupName }: { groupName?: string }) {
  return (
    <span className={`${styles.root} small text-muted vertical-center`}>
      <LayoutGrid aria-hidden="true" className="icon icon-xs" /> Group:{' '}
      {groupName || 'Unassigned'}
    </span>
  );
}
