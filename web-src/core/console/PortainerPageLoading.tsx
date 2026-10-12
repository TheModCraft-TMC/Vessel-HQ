import styles from './PortainerPage.module.css';

export function PortainerPageLoading() {
  return (
    <div className={styles.loading} aria-busy="true" aria-label="Loading page">
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
