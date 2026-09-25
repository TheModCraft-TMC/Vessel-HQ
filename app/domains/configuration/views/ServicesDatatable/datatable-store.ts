import type { KubeTableSettings as TableSettings } from '@/domains/clusters';
import { systemResourcesSettings } from '@/domains/clusters';
import {
  refreshableSettings,
  createPersistedStore,
} from '@/ui/components/data-table/types';

export function createStore(storageKey: string) {
  return createPersistedStore<TableSettings>(storageKey, 'name', (set) => ({
    ...refreshableSettings(set),
    ...systemResourcesSettings(set),
  }));
}
