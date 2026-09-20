import {
  type BasicTableSettings,
  type FilteredColumnsTableSettings,
  type SettableColumnsTableSettings,
  hiddenColumnsSettings,
  filteredColumnsSettings,
} from '@@/datatables/types';
import { useTableStateWithStorage } from '@@/datatables/useTableState';

export interface TableSettings
  extends
    BasicTableSettings,
    SettableColumnsTableSettings,
    FilteredColumnsTableSettings {
  showOrphanedStacks: boolean;
  setShowOrphanedStacks(value: boolean): void;
}

const tableKey = 'docker_stacks';

export function useStore() {
  return useTableStateWithStorage<TableSettings>(tableKey, 'name', (set) => ({
    ...hiddenColumnsSettings(set),
    ...filteredColumnsSettings(set),
    showOrphanedStacks: false,
    setShowOrphanedStacks(showOrphanedStacks) {
      set((s) => ({ ...s, showOrphanedStacks }));
    },
  }));
}
