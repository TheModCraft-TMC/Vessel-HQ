import { createStore } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

import { keyBuilder } from '@/core/hooks/useLocalStorage';
import { getBrowserLocalStorage } from '@/shared/browser-storage';

type State = {
  isExpanded: boolean;
  setIsExpanded(expanded: boolean): void;
};

export const summaryStore = createStore<State>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        isExpanded: true,
        setIsExpanded: (expanded: boolean) => set({ isExpanded: expanded }),
      }),
      {
        name: keyBuilder('kubernetes-summary-expanded'),
        getStorage: getBrowserLocalStorage,
      }
    )
  )
);
