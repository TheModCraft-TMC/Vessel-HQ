import { Fragment, PropsWithChildren } from 'react';
import { Row } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';

import { Icon } from '@/ui/components/icons/Icon';

import { DefaultType } from './types';

interface Props<T extends DefaultType = DefaultType> {
  isLoading?: boolean;
  rows: Row<T>[];
  emptyContent?: string;
  renderRow(row: Row<T>): React.ReactNode;
}

export function TableContent<T extends DefaultType = DefaultType>({
  isLoading = false,
  rows,
  emptyContent = 'No items available.',
  renderRow,
}: Props<T>) {
  if (isLoading) {
    return (
      <tr className="datatable-loading-row">
        <td colSpan={Number.MAX_SAFE_INTEGER}>
          <div
            className="datatable-loading-state"
            role="status"
            aria-label="Loading table content"
          >
            <Icon icon={Loader2} className="h-8 w-8 animate-spin-slow" />
            <span>Loading...</span>
          </div>
        </td>
      </tr>
    );
  }

  if (!rows.length) {
    return <TableContentOneColumn>{emptyContent}</TableContentOneColumn>;
  }

  return (
    <>
      {rows.map((row, index) => (
        <Fragment key={`${row.id}-${index}`}>{renderRow(row)}</Fragment>
      ))}
    </>
  );
}

function TableContentOneColumn({ children }: PropsWithChildren<unknown>) {
  // using MAX_SAFE_INTEGER to make sure the single column will be the size of the table
  return (
    <tr>
      <td colSpan={Number.MAX_SAFE_INTEGER} className="text-muted text-center">
        {children}
      </td>
    </tr>
  );
}
