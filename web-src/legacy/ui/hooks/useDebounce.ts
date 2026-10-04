import { debounce } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebounce<T = string>(
  value: T,
  onChange: (value: T) => void,
  delay = 300
) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const onChangeDebouncer = useRef(
    debounce(
      (nextValue: T, onChangeFunc: (next: T) => void) =>
        onChangeFunc(nextValue),
      delay
    )
  );

  const handleChange = useCallback(
    (nextValue: T) => {
      setDebouncedValue(nextValue);
      onChangeDebouncer.current(nextValue, onChange);
    },
    [onChange]
  );

  useEffect(() => setDebouncedValue(value), [value]);

  return [debouncedValue, handleChange] as const;
}
