import {
  refreshableSettings,
  hiddenColumnsSettings,
  RefreshableTableSettings,
  SettableColumnsTableSettings,
  createPersistedStore,
  BasicTableSettings,
} from '@/ui/components/data-table/types';

interface TableSettings
  extends
    BasicTableSettings,
    SettableColumnsTableSettings,
    RefreshableTableSettings {}

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(
    storageKey,
    'time',

    (set) => ({
      ...hiddenColumnsSettings(set),
      ...refreshableSettings(set),
    })
  );
}
