import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
} from '@tanstack/react-table';

import { MultipleSelectionFilter, filterHOC } from './Filter';

function renderDefault({
  options = ['Option 1', 'Option 2', 'Option 3'],
  value = [],
  filterKey = 'test-filter',
  onChange = vi.fn(),
  menuTitle = 'Filter by state',
}: Partial<Parameters<typeof MultipleSelectionFilter>[0]> = {}) {
  return render(
    <MultipleSelectionFilter
      options={options}
      value={value}
      filterKey={filterKey}
      onChange={onChange}
      menuTitle={menuTitle}
    />
  );
}

describe('MultipleSelectionFilter', () => {
  it('should render the filter button', () => {
    renderDefault();

    const button = screen.getByRole('button', { name: /filter/i });
    expect(button).toBeInTheDocument();
  });

  it.each([
    { value: [], hasActiveClass: false, description: 'no filters' },
    {
      value: ['Option 1'],
      hasActiveClass: true,
      description: 'filters active',
    },
  ])(
    'should apply filter-active class based on selection state: $description',
    ({ value, hasActiveClass }) => {
      renderDefault({ value });

      const button = screen.getByRole('button', { name: /filter/i });
      if (hasActiveClass) {
        expect(button).toHaveClass('filter-active');
      } else {
        expect(button).not.toHaveClass('filter-active');
      }
    }
  );

  it('should open the filter menu when button is clicked', async () => {
    const user = userEvent.setup();
    renderDefault();

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    expect(screen.getByText('Filter by state')).toBeInTheDocument();
  });

  it('should render all filter options', async () => {
    const user = userEvent.setup();
    const options = ['Running', 'Stopped', 'Paused'];
    renderDefault({ options });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    options.forEach((option) => {
      expect(screen.getByLabelText(option)).toBeInTheDocument();
    });
  });

  it('should render custom menu title', async () => {
    const user = userEvent.setup();
    const menuTitle = 'Filter by custom state';
    renderDefault({ menuTitle });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    expect(screen.getByText(menuTitle)).toBeInTheDocument();
  });

  it('should check the boxes for selected values', async () => {
    const user = userEvent.setup();
    const options = ['Running', 'Stopped', 'Paused'];
    const value = ['Running', 'Paused'];
    renderDefault({ options, value });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    const runningCheckbox = screen.getByLabelText('Running');
    const stoppedCheckbox = screen.getByLabelText('Stopped');
    const pausedCheckbox = screen.getByLabelText('Paused');

    expect(runningCheckbox).toBeChecked();
    expect(stoppedCheckbox).not.toBeChecked();
    expect(pausedCheckbox).toBeChecked();
  });

  it.each([
    {
      description: 'adding a value',
      initialValue: ['Running'],
      clickOption: 'Stopped',
      expectedValue: ['Running', 'Stopped'],
    },
    {
      description: 'removing a value',
      initialValue: ['Running', 'Stopped'],
      clickOption: 'Running',
      expectedValue: ['Stopped'],
    },
  ])(
    'should call onChange when $description',
    async ({ initialValue, clickOption, expectedValue }) => {
      const user = userEvent.setup();
      const options = ['Running', 'Stopped', 'Paused'];
      const onChange = vi.fn();
      renderDefault({ options, value: initialValue, onChange });

      const button = screen.getByRole('button', { name: /filter/i });
      await user.click(button);

      const checkbox = screen.getByLabelText(clickOption);
      await user.click(checkbox);

      expect(onChange).toHaveBeenCalledWith(expectedValue);
    }
  );

  it('should call onChange only once per click', async () => {
    const user = userEvent.setup();
    const options = ['Running', 'Stopped'];
    const onChange = vi.fn();
    renderDefault({ options, onChange });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    const runningCheckbox = screen.getByLabelText('Running');
    await user.click(runningCheckbox);

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should render checkboxes with correct data-cy attributes', async () => {
    const user = userEvent.setup();
    const options = ['Running', 'Stopped'];
    const filterKey = 'status';
    renderDefault({ options, filterKey });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    expect(screen.getByTestId('filter_status_0')).toBeInTheDocument();
    expect(screen.getByTestId('filter_status_1')).toBeInTheDocument();
  });

  it('should preserve values that are not in the options list', async () => {
    const user = userEvent.setup();
    const options = ['Running', 'Stopped'];
    const value = ['Running', 'Paused']; // 'Paused' is not in options
    renderDefault({ options, value });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    // Should render all unique values from both options and value
    expect(screen.getByLabelText('Running')).toBeInTheDocument();
    expect(screen.getByLabelText('Stopped')).toBeInTheDocument();
    expect(screen.getByLabelText('Paused')).toBeInTheDocument();

    // Check that 'Running' and 'Paused' are checked
    const runningCheckbox = screen.getByLabelText('Running');
    const pausedCheckbox = screen.getByLabelText('Paused');
    expect(runningCheckbox).toBeChecked();
    expect(pausedCheckbox).toBeChecked();
  });

  it('should handle empty options array', async () => {
    const user = userEvent.setup();
    renderDefault({ options: [] });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    const menuContent = screen.getByText('Filter by state').parentElement;
    const checkboxes = menuContent?.querySelectorAll(
      '[role="menuitemcheckbox"]'
    );
    expect(checkboxes?.length).toBe(0);
  });

  it('should handle selecting all options', async () => {
    const user = userEvent.setup();
    const options = ['Running', 'Stopped'];
    const onChange = vi.fn();
    renderDefault({ options, value: [], onChange });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    // Click all options
    await user.click(screen.getByLabelText('Running'));
    await user.click(screen.getByLabelText('Stopped'));

    expect(onChange).toHaveBeenNthCalledWith(1, ['Running']);
    expect(onChange).toHaveBeenNthCalledWith(2, ['Stopped']);
  });

  it('should handle deselecting all options', async () => {
    const user = userEvent.setup();
    const options = ['Running', 'Stopped'];
    const value = ['Running', 'Stopped'];
    const onChange = vi.fn();
    renderDefault({ options, value, onChange });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    // Uncheck first option
    await user.click(screen.getByLabelText('Running'));
    expect(onChange).toHaveBeenNthCalledWith(1, ['Stopped']);

    // Uncheck second option (note: the component still has the original value)
    await user.click(screen.getByLabelText('Stopped'));
    expect(onChange).toHaveBeenNthCalledWith(2, ['Running']);
  });

  it('should remove duplicates from combined options and values', async () => {
    const user = userEvent.setup();
    const options = ['Running', 'Stopped', 'Running']; // duplicate 'Running'
    const value = ['Running', 'Paused', 'Running']; // duplicate 'Running'
    renderDefault({ options, value });

    const button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);

    const menuContent = screen.getByText('Filter by state').parentElement;
    const checkboxes = within(menuContent!).getAllByRole('menuitemcheckbox');

    // Should only have 3 unique options: Running, Stopped, Paused
    expect(checkboxes.length).toBe(3);
  });

  it('should maintain correct checked state after multiple interactions', async () => {
    const user = userEvent.setup();
    const options = ['Running', 'Stopped', 'Paused'];
    const onChange = vi.fn();

    const { rerender } = renderDefault({
      options,
      value: ['Running'],
      onChange,
    });

    // Open menu and click 'Stopped'
    let button = screen.getByRole('button', { name: /filter/i });
    await user.click(button);
    await user.click(screen.getByLabelText('Stopped'));

    // Rerender with new value
    rerender(
      <MultipleSelectionFilter
        options={options}
        value={['Running', 'Stopped']}
        filterKey="test-filter"
        onChange={onChange}
        menuTitle="Filter by state"
      />
    );

    // Open menu again and verify state
    button = screen.getByRole('button', { name: /filter/i });
    if (button.getAttribute('aria-expanded') !== 'true') {
      await user.click(button);
    }

    const runningCheckbox = screen.getByLabelText('Running');
    const stoppedCheckbox = screen.getByLabelText('Stopped');
    const pausedCheckbox = screen.getByLabelText('Paused');

    expect(runningCheckbox).toBeChecked();
    expect(stoppedCheckbox).toBeChecked();
    expect(pausedCheckbox).not.toBeChecked();
  });
});

// Filter.tsx is compiled by the Vitest Babel transform, as it is in production.
// TanStack methods stay referentially stable while their return values change.
const StatusFilter = filterHOC<{ id: string; status: string }>('Filter status');
const statusColumns = [
  {
    accessorKey: 'status',
    filterFn: (
      row: import('@tanstack/react-table').Row<{ id: string; status: string }>,
      id: string,
      values: string[]
    ) => values.includes(row.getValue(id)),
  },
];
const statusRows = [
  { id: '1', status: 'Running' },
  { id: '2', status: 'Stopped' },
];
const tableMeta = {};

function StatefulFilter({ rows = statusRows }: { rows?: typeof statusRows }) {
  const table = useReactTable({
    data: rows,
    autoResetPageIndex: false,
    columns: statusColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
  });
  return (
    <>
      <StatusFilter column={table.getColumn('status')!} tableMeta={tableMeta} />
      <output aria-label="Filtered rows">
        {table
          .getRowModel()
          .rows.map((row) => row.original.id)
          .join(',')}
      </output>
    </>
  );
}

it('keeps checkbox state and row filtering current with stable TanStack column methods', async () => {
  const user = userEvent.setup();
  render(<StatefulFilter />);
  await user.click(screen.getByRole('button', { name: /filter/i }));
  await user.click(screen.getByLabelText('Running'));
  expect(screen.getByLabelText('Running')).toBeChecked();
  expect(screen.getByLabelText('Stopped')).not.toBeChecked();
  expect(screen.getByLabelText('Filtered rows')).toHaveTextContent(/^1$/);

  await user.click(screen.getByLabelText('Stopped'));
  expect(screen.getByLabelText('Running')).toBeChecked();
  expect(screen.getByLabelText('Stopped')).toBeChecked();
  expect(screen.getByLabelText('Filtered rows')).toHaveTextContent(/^1,2$/);

  await user.click(screen.getByLabelText('Running'));
  expect(screen.getByLabelText('Running')).not.toBeChecked();
  expect(screen.getByLabelText('Stopped')).toBeChecked();
  expect(screen.getByLabelText('Filtered rows')).toHaveTextContent(/^2$/);
});

it('refreshes faceted filter options after data changes on the same column instance', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<StatefulFilter />);
  await user.click(screen.getByRole('button', { name: /filter/i }));
  expect(screen.getByLabelText('Running')).toBeInTheDocument();
  rerender(<StatefulFilter rows={[{ id: '3', status: 'Paused' }]} />);
  expect(screen.getByLabelText('Paused')).toBeInTheDocument();
  expect(screen.queryByLabelText('Running')).not.toBeInTheDocument();
});

// REVIEW: Exercise real Radix keyboard navigation, not only pointer clicks.
it('opens, navigates, toggles multiple choices and restores focus using only keys', async () => {
  const user = userEvent.setup();
  render(<StatefulFilter />);
  const trigger = screen.getByRole('button', { name: /filter/i });
  await user.tab();
  expect(trigger).toHaveFocus();
  await user.keyboard('{Enter}');
  const running = await screen.findByRole('menuitemcheckbox', {
    name: 'Running',
  });
  const stopped = screen.getByRole('menuitemcheckbox', { name: 'Stopped' });
  expect(running).toHaveFocus();
  await user.keyboard(' ');
  expect(running).toBeChecked();
  expect(screen.getByLabelText('Filtered rows')).toHaveTextContent(/^1$/);
  await user.keyboard('{ArrowDown}');
  expect(stopped).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(stopped).toBeChecked();
  expect(screen.getByLabelText('Filtered rows')).toHaveTextContent(/^1,2$/);
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
