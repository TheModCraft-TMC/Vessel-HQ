import clsx from 'clsx';
import { useMemo } from 'react';
import { Column, Row, TableMeta } from '@tanstack/react-table';
import { Check, Filter } from 'lucide-react';
import _ from 'lodash';

import {
  Menu,
  MenuButton,
  MenuCheckboxItem,
  MenuPopover,
} from '@/ui/components/menu';
import { Icon } from '@/ui/components/icons/Icon';

import { getValueAsArrayOfStrings } from './utils';
import { DefaultType } from './types';

interface MultipleSelectionFilterProps {
  options: Array<string> | ReadonlyArray<string>;
  value: string[];
  filterKey: string;
  onChange: (value: string[]) => void;
  menuTitle?: string;
}

export function MultipleSelectionFilter({
  options,
  value = [],
  filterKey,
  onChange,
  menuTitle = 'Filter by state',
}: MultipleSelectionFilterProps) {
  const enabled = value.length > 0;

  // This will make sure that if the current value has options that are not in the options list,
  // they will still be displayed in the filter menu.
  const optionsWithValues = useMemo(
    () => _.uniq([...options, ...value]),
    [options, value]
  );

  return (
    <div>
      <Menu>
        <MenuButton
          className={clsx('table-filter flex items-center gap-1', {
            'filter-active': enabled,
          })}
        >
          Filter
          <Icon icon={enabled ? Check : Filter} />
        </MenuButton>
        <MenuPopover className="dropdown-menu">
          <div className="tableMenu">
            <div className="menuHeader">{menuTitle}</div>
            <div className="menuContent">
              {/* Native inputs are not Radix menu items: Tab is suppressed
                  and arrow keys cannot reach them. Keep the menu open while its
                  registered checkbox items support arrows, typeahead and Space. */}
              {optionsWithValues.map((option, index) => (
                <MenuCheckboxItem
                  key={option}
                  aria-label={option}
                  checked={value.includes(option)}
                  onCheckedChange={() => handleChange(option)}
                  onSelect={(event) => event.preventDefault()}
                  data-cy={`filter_${filterKey}_${index}`}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 outline-none focus:bg-graphite-100 th-highcontrast:focus:bg-graphite-700 th-dark:focus:bg-graphite-700"
                >
                  <span
                    aria-hidden
                    className="flex h-4 w-4 items-center justify-center rounded border border-solid border-current"
                  >
                    {value.includes(option) && <Icon icon={Check} size="sm" />}
                  </span>
                  {option}
                </MenuCheckboxItem>
              ))}
            </div>
          </div>
        </MenuPopover>
      </Menu>
    </div>
  );

  function handleChange(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((o) => o !== option));

      return;
    }

    onChange([...value, option]);
  }
}

export type FilterOptionsTransformer<TData extends DefaultType> = (
  rows: Row<TData>[],
  id: string,
  tableMeta: TableMeta<TData>
) => string[];

export function filterHOC<TData extends DefaultType>(
  menuTitle: string,
  filterOptionsTransformer: FilterOptionsTransformer<TData> = defaultFilterOptionsTransformer
) {
  return function Filter({
    column: { getFilterValue, setFilterValue, getFacetedRowModel, id },
    tableMeta,
  }: {
    column: Column<TData>;
    tableMeta: TableMeta<TData>;
  }) {
    'use no memo';
    // TanStack getters are stable references over mutable filter/facet state.
    // Do not cache their results by method identity (including in future compilers).
    const { flatRows } = getFacetedRowModel();

    const options = useMemo(
      () => filterOptionsTransformer(flatRows, id, tableMeta),
      [flatRows, id, tableMeta]
    );

    const value = getFilterValue();

    const valueAsArray = getValueAsArrayOfStrings(value);

    return (
      <MultipleSelectionFilter
        options={options}
        filterKey={id}
        value={valueAsArray}
        onChange={setFilterValue}
        menuTitle={menuTitle}
      />
    );
  };
}

function defaultFilterOptionsTransformer<TData extends DefaultType>(
  rows: Row<TData>[],
  id: string
) {
  const options = new Set<string>();
  rows.forEach(({ getValue }) => {
    const value = getValue<string>(id);
    options.add(value);
  });
  return Array.from(options);
}
