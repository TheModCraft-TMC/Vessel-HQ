import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useReducer,
} from 'react';
import _ from 'lodash';

import { breakpoints } from '@/ui';

import { sidebarStore } from './sidebarStore';

interface State {
  isOpen: boolean;
  toggle(): void;
}

export const Context = createContext<State | null>(null);
Context.displayName = 'SidebarContext';

export function useSidebarState() {
  const context = useContext(Context);

  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }

  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle, setOpen } = sidebarStore();
  const prevIsOpen = useRef<boolean | null>(null);

  useEffect(() => {
    if (window.ddExtension) {
      return undefined;
    }

    const onResize = _.debounce(() => {
      const currentIsOpen = sidebarStore.getState().isOpen;
      if (isMobile()) {
        if (currentIsOpen) {
          prevIsOpen.current = currentIsOpen;
          setOpen(false);
        }
      } else if (prevIsOpen.current !== null) {
        setOpen(prevIsOpen.current);
        prevIsOpen.current = null;
      }
    }, 50);

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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

  return <Context.Provider value={state}> {children} </Context.Provider>;
}

function isMobile() {
  return window.innerWidth <= breakpoints.phone;
}
