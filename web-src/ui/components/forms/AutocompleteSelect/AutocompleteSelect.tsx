import '@reach/combobox/styles.css';

import { useState, ChangeEvent } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
  ComboboxPopover,
} from '@reach/combobox';
import clsx from 'clsx';

import { useDebounce } from '@/ui/hooks/useDebounce';
import type { AutomationTestingProps } from '@/ui/types';
import { Option } from '@/ui/components/forms/PortainerSelect';

import styles from './AutocompleteSelect.module.css';

export function AutocompleteSelect({
  value,
  onChange,
  onSelect,
  placeholder,
  searchResults,
  readOnly,
  disabled,
  inputId,
  'data-cy': dataCy,
}: {
  value: string;
  /**
   * onChange is called whenever the input is changed or an option is selected
   *
   * when the input is changed, the call is debounced
   */
  onChange(value: string): void;
  /**
   * onSelect is called when the value is settled: an option is picked from the
   * suggestion list, or the field is left after typing. Never while the input
   * is still focused and being edited — so a consumer can tell a value the user
   * is done with apart from text still being typed.
   */
  onSelect?(value: string): void;
  placeholder?: string;
  searchResults?: Option<string>[];
  readOnly?: boolean;
  /**
   * Blocks editing and greys the control, matching a disabled Input. Prefer it
   * over readOnly alone, which suppresses typing with no visual change and so
   * reads as an editable field that has stopped working.
   */
  disabled?: boolean;
  inputId: string;
} & AutomationTestingProps) {
  const [searchTerm, setSearchTerm] = useDebounce(value, onChange);
  const [selected, setSelected] = useState(false);

  return (
    <Combobox
      className={clsx(styles.root, 'form-control', {
        'bg-(--bg-form-control-disabled-color)': disabled,
      })}
      onSelect={handleSelect}
      data-cy="component-gitComposeInput"
    >
      <ComboboxInput
        value={searchTerm}
        className="w-full border-none bg-transparent outline-hidden"
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        id={inputId}
        autoComplete="off"
        data-cy={dataCy}
      />
      {!selected && searchResults && searchResults.length > 0 && (
        <ComboboxPopover>
          <ComboboxList>
            {searchResults.map((option: Option<string>) => (
              <ComboboxOption
                key={option.value}
                value={option.value}
                className={clsx(
                  `th-highcontrast:aria-selected:bg-black! th-dark:aria-selected:bg-black!`,
                  `th-highcontrast:hover:bg-black! th-dark:hover:bg-black!`,
                  'th-highcontrast:bg-gray-10 th-dark:bg-gray-10'
                )}
              />
            ))}
          </ComboboxList>
        </ComboboxPopover>
      )}
    </Combobox>
  );

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
    setSelected(false);
  }

  function handleBlur() {
    onSelect?.(searchTerm);
  }

  function handleSelect(value: string) {
    onChange(value);
    onSelect?.(value);
    setSelected(true);
  }
}
