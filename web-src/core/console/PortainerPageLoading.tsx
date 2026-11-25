import styles from './PortainerPage.module.css';
import { RouteLoadingActivity } from './RequestProgress/RequestProgress';

export function PortainerPageLoading() {
  return (
    <div className={styles.loading} aria-busy="true" aria-label="Loading page">
      <RouteLoadingActivity />
      <div className={styles.title} />
      <div className={styles.toolbar} />
      <div className={styles.table}>
        {Array.from({ length: 6 }, (_, index) => (
          <div className={styles.row} key={index} />
        ))}
      </div>
    </div>
  );
}
