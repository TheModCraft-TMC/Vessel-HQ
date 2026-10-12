import create from 'zustand';
import { persist } from 'zustand/middleware';

import { keyBuilder } from '@/core/hooks/useLocalStorage';
import { getBrowserLocalStorage } from '@/shared/browser-storage';

interface UIState {
  dismissedInfoPanels: Record<string, boolean>;
  dismissInfoPanel(id: string): void;

  dismissedInfoHash: string;
  dismissMotd(hash: string): void;

  dismissedUpdateVersion: string;
  dismissUpdateVersion(version: string): void;
}

export const useUIState = create<UIState>()(
  persist(
    (set) => ({
      dismissedInfoPanels: {},
      dismissInfoPanel(id: string) {
        set((state) => ({
          dismissedInfoPanels: { ...state.dismissedInfoPanels, [id]: true },
        }));
      },
      dismissedInfoHash: '',
      dismissMotd(hash: string) {
        set({ dismissedInfoHash: hash });
      },
      dismissedUpdateVersion: '',
      dismissUpdateVersion(version: string) {
        set({ dismissedUpdateVersion: version });
      },
    }),
    {
      name: keyBuilder('NEW_UI_STATE'),
      getStorage: getBrowserLocalStorage,
    }
  )
);
