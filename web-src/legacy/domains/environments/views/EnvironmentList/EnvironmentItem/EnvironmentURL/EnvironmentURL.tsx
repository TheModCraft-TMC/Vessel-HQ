import type { Environment } from '@/domains/environments';
import { isEdgeEnvironment } from '@/domains/environments/utils';

import styles from './EnvironmentURL.module.css';

export function EnvironmentURL({ environment }: { environment: Environment }) {
  if (isEdgeEnvironment(environment.Type)) {
    return null;
  }

  return (
    <span className={`${styles.root} small text-muted vertical-center`}>
      {environment.URL}
    </span>
  );
}
