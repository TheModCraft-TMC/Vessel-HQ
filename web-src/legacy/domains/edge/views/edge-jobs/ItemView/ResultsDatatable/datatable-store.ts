import {
  refreshableSettings,
  createPersistedStore,
  BasicTableSettings,
  RefreshableTableSettings,
  BackendPaginationTableSettings,
  backendPaginationSettings,
} from '@/ui/components/data-table/types';

interface TableSettings
  extends
    BasicTableSettings,
    RefreshableTableSettings,
    BackendPaginationTableSettings {}

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, undefined, (set) => ({
    ...refreshableSettings(set),
    ...backendPaginationSettings(set),
  }));
}
