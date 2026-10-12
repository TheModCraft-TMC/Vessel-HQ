'use client';

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import {
  SIDEBAR_MOBILE_BREAKPOINT,
  sidebarStore,
} from './sidebarStore';

interface State {
  isOpen: boolean;
  toggle(): void;
}

export const Context = createContext<State | null>(null);
Context.displayName = 'SidebarContext';

export function useSidebarState() {
  const context = useContext(Context);

  if (!context) {
    throw new Error('useSidebarState must be used within a SidebarProvider');
  }

  return context;
}

export function SidebarProvider({ children }: PropsWithChildren<unknown>) {
  'use no memo';

  const { isOpen, toggle, setOpen } = sidebarStore();
  const desktopState = useRef<boolean | null>(null);

  useEffect(() => {
    if (window.ddExtension) {
      return undefined;
    }

    let resizeTimer: number | undefined;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const currentIsOpen = sidebarStore.getState().isOpen;

        if (window.innerWidth <= SIDEBAR_MOBILE_BREAKPOINT) {
          if (currentIsOpen) {
            desktopState.current = currentIsOpen;
            setOpen(false);
          }
        } else if (desktopState.current !== null) {
          setOpen(desktopState.current);
          desktopState.current = null;
        }
      }, 50);
    }

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [setOpen]);

  const state = useMemo(() => ({ isOpen, toggle }), [isOpen, toggle]);

  return <Context.Provider value={state}>{children}</Context.Provider>;
}

export function TestSidebarProvider({ children }: PropsWithChildren<unknown>) {
  const [isOpen, toggle] = useReducer((state) => !state, true);
  const state = useMemo(
    () => ({ isOpen, toggle: () => toggle() }),
    [isOpen, toggle]
  );

  return <Context.Provider value={state}>{children}</Context.Provider>;
}
