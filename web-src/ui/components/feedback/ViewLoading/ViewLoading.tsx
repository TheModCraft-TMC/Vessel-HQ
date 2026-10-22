import styles from './ViewLoading.module.css';

interface Props {
  message?: string;
}

export function ViewLoading({ message }: Props) {
  return (
    <div
      className={styles.root}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className="w-full max-w-5xl animate-pulse space-y-5 motion-reduce:animate-none"
        aria-hidden="true"
        data-cy="view-loading-skeleton"
      >
        <div className="space-y-3">
          <div className="h-6 w-52 rounded-sm bg-gray-3 th-dark:bg-gray-8" />
          <div className="h-3 w-72 max-w-full rounded-sm bg-gray-2 th-dark:bg-gray-9" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className="space-y-4 rounded-lg border border-solid border-gray-3 p-5 th-highcontrast:border-gray-7 th-dark:border-gray-8">
          <div className="h-4 w-40 rounded-sm bg-gray-3 th-dark:bg-gray-8" />
          <div className="h-3 w-full rounded-sm bg-gray-2 th-dark:bg-gray-9" />
          <div className="h-3 w-11/12 rounded-sm bg-gray-2 th-dark:bg-gray-9" />
          <div className="h-3 w-4/5 rounded-sm bg-gray-2 th-dark:bg-gray-9" />
        </div>
      </div>

      <span className={styles.message}>{message || 'Loading...'}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-lg border border-solid border-gray-3 p-4 th-highcontrast:border-gray-7 th-dark:border-gray-8">
      <div className="h-3 w-20 rounded-sm bg-gray-3 th-dark:bg-gray-8" />
      <div className="h-5 w-32 rounded-sm bg-gray-2 th-dark:bg-gray-9" />
    </div>
  );
}
