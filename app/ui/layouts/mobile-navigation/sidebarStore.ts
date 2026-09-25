import create from 'zustand';

import { breakpoints } from '@/ui/tokens';

const storageKey = 'toolbar_toggle';

function getInitialIsOpen() {
  if (window.ddExtension) return false;
  if (window.innerWidth <= breakpoints.phone) return false;
  try {
    const value = localStorage.getItem(`portainer.${storageKey}`);
    return value ? JSON.parse(value) : true;
  } catch {
    return true;
  }
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
    localStorage.setItem(`portainer.${storageKey}`, JSON.stringify(newIsOpen));
    set({ isOpen: newIsOpen });
  },
  setOpen: (value: boolean) => {
    set({ isOpen: value });
  },
}));
