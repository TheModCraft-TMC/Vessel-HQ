import clsx from 'clsx';

import styles from './SortableListPagerInfo.module.css';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface Props {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageSizeChange: (pageSize: number) => void;
  onPageChange: (page: number) => void;
}

export function SortableListPagerInfo({
  page,
  pageSize,
  totalCount,
  onPageSizeChange,
  onPageChange,
}: Props) {
  if (totalCount === 0) return null;

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalCount);

  return (
    <div className={clsx(styles.root, 'flex items-center gap-3')}>
      <span>
        Showing{' '}
        <strong>
          {start}–{end}
        </strong>{' '}
        of <strong>{totalCount}</strong>
      </span>

      <select
        className={clsx(
          'rounded-sm border border-solid border-gray-4 bg-transparent px-2 py-1',
          'text-xs text-gray-7 th-highcontrast:text-gray-4 th-dark:border-gray-7 th-dark:text-gray-4',
          'th-highcontrast:bg-black th-dark:bg-gray-iron-10',
          'cursor-pointer focus:outline-hidden'
        )}
        value={pageSize}
        onChange={(e) => {
          onPageSizeChange(Number(e.target.value));
          onPageChange(0);
        }}
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option
            key={size}
            value={size}
            className="th-highcontrast:bg-black th-dark:bg-gray-iron-10"
          >
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}
