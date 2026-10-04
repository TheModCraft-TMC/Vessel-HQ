import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { get, set } from './useLocalStorage';

type PersistOptions = {
  storageKey: string;
  persistedKeys: string[];
};

/** Only use when you need to use/update a single param at a time. Using this to update multiple params will cause the state to get out of sync. */
export function useParamState<T>(
  param: string,
  parseParam: (param: string | undefined) => T | undefined = (param) =>
    param as unknown as T
) {
  const [params, updateParams] = useUrlParams();
  const paramValue = params[param];
  const state = parseParam(paramValue);

  return [
    state,
    (value?: T) => {
      updateParams({ [param]: value });
    },
  ] as const;
}

/** Use this when you need to use/update multiple params at once. */
export function useParamsState<T extends Record<string, unknown>>(
  parseParams: (params: Record<string, string | undefined>) => T
) {
  const [stateParams, updateParams] = useUrlParams();

  const state = parseParams(stateParams);

  function setState(newState: Partial<T>) {
    updateParams(newState);
  }

  return [state, setState] as const;
}

/** Use this when you need to use/update multiple params and persist a subset to session storage. */
export function usePersistedParamsState<T extends Record<string, unknown>>(
  parseParams: (params: Record<string, unknown>) => T,
  persist?: PersistOptions
): [T, (partial: Partial<T>) => void] {
  const [stateParams, updateParams] = useUrlParams();

  const persistedParams = persist ? readPersisted(persist) : null;
  const trackedKeys = persist?.persistedKeys ?? [];

  const shouldHydrateFromStorage =
    !!persistedParams &&
    trackedKeys.length > 0 &&
    trackedKeys.some(
      (k) => persistedParams[k] != null && stateParams[k] == null
    );

  const effectiveParams: Record<string, unknown> = shouldHydrateFromStorage
    ? {
        ...stateParams,
        ...Object.fromEntries(
          trackedKeys
            .filter((k) => stateParams[k] == null)
            .map((k) => [k, persistedParams![k]])
        ),
      }
    : stateParams;

  const state = parseParams(effectiveParams);

  useEffect(() => {
    if (!persist || !shouldHydrateFromStorage) return;
    const stored = readPersisted(persist);
    const toRestore = Object.fromEntries(
      trackedKeys
        .filter((k) => stateParams[k] == null && stored[k] != null)
        .map((k) => [k, stored[k]])
    );
    if (Object.keys(toRestore).length === 0) return;
    updateParams(toRestore);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldHydrateFromStorage]);

  useEffect(() => {
    if (!persist || shouldHydrateFromStorage) return;
    if (!trackedKeys.some((k) => stateParams[k] != null)) return;
    writePersisted(persist, pickKeys(state, persist.persistedKeys));
  });

  function setState(partial: Partial<T>) {
    if (persist) {
      const stored = readPersisted(persist);
      const updates = Object.fromEntries(
        persist.persistedKeys
          .filter((k) => k in partial)
          .map((k) => [k, (partial as Record<string, unknown>)[k]])
      );
      writePersisted(persist, { ...stored, ...updates });
    }
    updateParams(partial);
  }

  return [state, setState];
}

function readPersisted(persist: PersistOptions): Record<string, unknown> {
  return get<Record<string, unknown>>(persist.storageKey, {}, localStorage);
}

function writePersisted(
  persist: PersistOptions,
  params: Record<string, unknown>
) {
  set(persist.storageKey, params, localStorage);
}

function pickKeys(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  return Object.fromEntries(keys.map((k) => [k, obj[k]]));
}

function useUrlParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = Object.fromEntries(searchParams.entries());

  function updateParams(updates: Record<string, unknown>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      next.delete(key);
      if (Array.isArray(value)) {
        value.forEach((item) => next.append(key, String(item)));
      } else if (value != null && value !== '') {
        next.set(key, String(value));
      }
    });
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return [params, updateParams] as const;
}
