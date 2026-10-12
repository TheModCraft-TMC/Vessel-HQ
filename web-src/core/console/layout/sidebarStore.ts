import create from 'zustand';

const storageKey = 'toolbar_toggle';
export const SIDEBAR_MOBILE_BREAKPOINT = 720;

function getInitialIsOpen() {
  if (typeof window === 'undefined') {
    return true;
  }

  if (window.ddExtension) return false;
  if (window.innerWidth <= SIDEBAR_MOBILE_BREAKPOINT) return false;

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
    const isOpen = !get().isOpen;

    try {
      localStorage.setItem(`portainer.${storageKey}`, JSON.stringify(isOpen));
    } catch {
      // Storage can be unavailable in hardened/private browser contexts.
    }

    set({ isOpen });
  },
  setOpen: (isOpen: boolean) => set({ isOpen }),
}));
