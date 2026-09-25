import { useCallback, useMemo, useState } from 'react';

const localStoragePrefix = 'portainer';

export function keyBuilder(key: string) {
  return `${localStoragePrefix}.${key}`;
}

export function get<T>(
  key: string,
  defaultValue: T,
  storage = localStorage
): T {
  const value = storage.getItem(keyBuilder(key));
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

export function set<T>(key: string, value: T, storage = localStorage) {
  storage.setItem(keyBuilder(key), JSON.stringify(value));
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  storage = localStorage
): [T, (value: T) => void] {
  const [value, setValue] = useState(get(key, defaultValue, storage));
  const handleChange = useCallback(
    (nextValue: T) => {
      setValue(nextValue);
      set(key, nextValue, storage);
    },
    [key, storage]
  );
  return useMemo(() => [value, handleChange], [value, handleChange]);
}
