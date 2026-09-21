import create from 'zustand';

import { breakpoints } from '@/ui';
import {
  get as getFromStorage,
  set as setToStorage,
} from '@/react/hooks/useLocalStorage';

const storageKey = 'toolbar_toggle';

function getInitialIsOpen() {
  if (window.ddExtension) return false;
  if (window.innerWidth <= breakpoints.phone) return false;
  return getFromStorage<boolean>(storageKey, true);
}

interface SidebarStore {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (value: boolean) => void;
}

export const sidebarStore = create<SidebarStore>()((set, get) => ({
  isOpen: getInitialIsOpen(),
  toggle: () => {
    const newIsOpen = !get().isOpen;
    setToStorage(storageKey, newIsOpen);
    set({ isOpen: newIsOpen });
  },
  setOpen: (value: boolean) => {
    set({ isOpen: value });
  },
}));
