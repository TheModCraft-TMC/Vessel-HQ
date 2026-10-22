import { Loader2, Search } from 'lucide-react';
import { ReactNode } from 'react';
import clsx from 'clsx';

import { Icon } from '@/ui/components/icons/Icon';

import { SortableGroup, SortableListGroup } from '../Group/SortableListGroup';
import { SortableListSkeleton } from '../Skeleton/SortableListSkeleton';

import styles from './SortableListBody.module.css';

interface Props<T> {
  isLoading: boolean;
  groups: SortableGroup<T>[];
  showGroupHeaders: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  renderColumnHeaders?: (groupKey: string, items: T[]) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  emptyMessage: string;
  'data-cy'?: string;
}

export function SortableListBody<T>({
  isLoading,
  groups,
  showGroupHeaders,
  renderItem,
  renderColumnHeaders,
  getItemKey,
  emptyMessage,
  'data-cy': dataCy,
}: Props<T>) {
  if (isLoading) {
    if (groups.length === 0) {
      return (
        <div className={styles.root}>
          <SortableListSkeleton />
        </div>
      );
    }

    return (
      <div className={clsx(styles.root, 'relative')}>
        <div className="pointer-events-none blur-xs">
          <Groups
            groups={groups}
            showGroupHeaders={showGroupHeaders}
            renderItem={renderItem}
            renderColumnHeaders={renderColumnHeaders}
            getItemKey={getItemKey}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon
            icon={Loader2}
            className="h-8 w-8 animate-spin-slow text-gray-6 th-dark:text-gray-4"
          />
        </div>
      </div>
    );
  }

  if (groups.length > 0) {
    return (
      <Groups
        groups={groups}
        showGroupHeaders={showGroupHeaders}
        renderItem={renderItem}
        renderColumnHeaders={renderColumnHeaders}
        getItemKey={getItemKey}
        data-cy={dataCy}
      />
    );
  }

  return (
    <div
      className={clsx(
        styles.root,
        'flex flex-col items-center gap-3 py-12 text-gray-6'
      )}
    >
      <Search className="h-8 w-8" />
      <p className="text-sm">{emptyMessage}</p>
    </div>
  );
}

interface GroupsProps<T> {
  groups: SortableGroup<T>[];
  showGroupHeaders: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  renderColumnHeaders?: (groupKey: string, items: T[]) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  'data-cy'?: string;
}

function Groups<T>({
  groups,
  showGroupHeaders,
  renderItem,
  renderColumnHeaders,
  getItemKey,
  'data-cy': dataCy,
}: GroupsProps<T>) {
  return (
    <div className={styles.root} data-cy={dataCy}>
      {groups.map((group) => (
        <SortableListGroup
          key={group.key}
          group={group}
          showHeader={showGroupHeaders}
          renderItem={renderItem}
          renderColumnHeaders={renderColumnHeaders}
          getItemKey={getItemKey}
        />
      ))}
    </div>
  );
}
