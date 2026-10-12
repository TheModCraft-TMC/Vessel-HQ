import createStore from 'zustand';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/core/hooks/useLocalStorage';
import { getBrowserLocalStorage } from '@/shared/browser-storage';

interface TableFiltersStore {
  groups: number[];
  setGroups(value: number[]): void;
  edgeGroups: number[];
  setEdgeGroups(value: number[]): void;
  tags: number[];
  setTags(value: number[]): void;
  checkIn: number;
  setCheckIn(value: number): void;
}

export const useFilterStore = createStore<TableFiltersStore>()(
  persist(
    (set) => ({
      edgeGroups: [],
      setEdgeGroups(edgeGroups: number[]) {
        set({ edgeGroups });
      },
      groups: [],
      setGroups(groups: number[]) {
        set({ groups });
      },
      tags: [],
      setTags(tags: number[]) {
        set({ tags });
      },
      checkIn: 0,
      setCheckIn(checkIn: number) {
        set({ checkIn });
      },
    }),
    {
      name: keyBuilder('edge-devices-meta-filters'),
      getStorage: getBrowserLocalStorage,
    }
  )
);
