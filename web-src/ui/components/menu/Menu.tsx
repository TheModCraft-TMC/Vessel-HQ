'use client';

/* eslint-disable react/jsx-props-no-spreading -- these adapters preserve the previous polymorphic menu API while delegating behavior to Radix. */

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import clsx from 'clsx';
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ElementType,
  type MouseEvent as ReactMouseEvent,
  type MouseEventHandler,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import styles from './Menu.module.css';

type MenuRenderState = { isExpanded: boolean };
const MenuStateContext = createContext<{
  open: boolean;
  setOpen(open: boolean): void;
} | null>(null);

export function Menu({
  children,
  className,
}: {
  children: ReactNode | ((state: MenuRenderState) => ReactNode);
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  void className;

  useEffect(() => {
    if (!open) return undefined;

    function closeOnOutsideMouseDown(event: MouseEvent) {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          '[data-console-menu-trigger], [data-console-menu-content]'
        )
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener('mousedown', closeOnOutsideMouseDown);
    return () =>
      document.removeEventListener('mousedown', closeOnOutsideMouseDown);
  }, [open]);

  return (
    <MenuStateContext.Provider value={{ open, setOpen }}>
      <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
        {typeof children === 'function'
          ? children({ isExpanded: open })
          : children}
      </DropdownMenu.Root>
    </MenuStateContext.Provider>
  );
}

export function MenuButton<T extends ElementType = 'button'>({
  as,
  children,
  onClick,
  ...props
}: {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>) {
  const Trigger = as ?? 'button';
  const menuState = useContext(MenuStateContext);

  return (
    <DropdownMenu.Trigger asChild>
      <Trigger
        {...props}
        data-console-menu-trigger=""
        onClick={(event: ReactMouseEvent<HTMLElement>) => {
          (onClick as MouseEventHandler<HTMLElement> | undefined)?.(event);
          if (event.detail === 0) {
            menuState?.setOpen(!menuState.open);
          }
        }}
      >
        {children}
      </Trigger>
    </DropdownMenu.Trigger>
  );
}

export function MenuList({
  className,
  sideOffset = 6,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenu.Content>) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        {...props}
        data-console-menu-content=""
        className={clsx(styles.root, className)}
        sideOffset={sideOffset}
        collisionPadding={8}
      />
    </DropdownMenu.Portal>
  );
}

export function MenuPopover({
  position,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenu.Content> & {
  position?: unknown;
}) {
  void position;
  return <MenuList {...props} />;
}

export const MenuItem = DropdownMenu.Item;

export function MenuLink({
  children,
  ...props
}: ComponentPropsWithoutRef<'a'>) {
  return (
    <DropdownMenu.Item asChild>
      <a {...props}>{children}</a>
    </DropdownMenu.Item>
  );
}

/* eslint-enable react/jsx-props-no-spreading */
