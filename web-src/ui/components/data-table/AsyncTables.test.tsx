import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BasicTable } from './BasicTable';
import { NestedDatatable } from './NestedDatatable';
import { CardExpandableList } from './CardExpandableList';
import { useTableStateWithoutStorage } from './useTableState';

const columns = [{ accessorKey: 'name', header: 'Name' }];
const loadedRows = [{ id: '1', name: 'Arrived row' }];
const replacementRows = [{ id: '2', name: 'Replacement row' }];

function AsyncTable({
  kind,
  dataset,
}: {
  kind: 'basic' | 'nested' | 'cards';
  dataset: typeof loadedRows;
}) {
  const settings = useTableStateWithoutStorage();
  if (kind === 'basic') {
    return (
      <BasicTable dataset={dataset} columns={columns} data-cy="async-basic" />
    );
  }
  if (kind === 'nested') {
    return (
      <NestedDatatable
        dataset={dataset}
        columns={columns}
        data-cy="async-nested"
      />
    );
  }
  return (
    <CardExpandableList
      data-cy="async-cards"
      dataset={dataset}
      columns={columns}
      settingsManager={settings}
      renderSubRow={() => <span>Expanded content</span>}
    />
  );
}

describe('async table data with React Compiler', () => {
  it('updates card expansion on the same row instance', () => {
    render(<AsyncTable kind="cards" dataset={loadedRows} />);
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByText('Expanded content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.queryByText('Expanded content')).not.toBeInTheDocument();
  });

  it.each(['basic', 'nested', 'cards'] as const)(
    '%s renders arriving and replaced rows without navigation',
    (kind) => {
      const { rerender } = render(<AsyncTable kind={kind} dataset={[]} />);
      rerender(<AsyncTable kind={kind} dataset={loadedRows} />);
      expect(screen.getByText('Arrived row')).toBeInTheDocument();
      rerender(<AsyncTable kind={kind} dataset={replacementRows} />);
      expect(screen.getByText('Replacement row')).toBeInTheDocument();
      expect(screen.queryByText('Arrived row')).not.toBeInTheDocument();
    }
  );
});
