import {
  createPersistedStore,
  refreshableSettings,
  TableSettingsWithRefreshable,
} from '@/ui/components/data-table/types';

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettingsWithRefreshable>(
    storageKey,
    'name',
    (set) => ({
      ...refreshableSettings(set),
    })
  );
}
