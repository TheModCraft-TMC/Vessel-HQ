import { PropsWithChildren, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import {
  buildHref,
  type RouteLinkProps,
} from '@console/routing/buildHref';

import {
  Menu,
  MenuButton as ReachMenuButton,
  MenuLink as ReachMenuLink,
  MenuList,
} from '@/ui/components/menu';
import type { AutomationTestingProps } from '@/shared/types';
import { Icon } from '@/ui/components/icons/Icon';

import { Props as ButtonProps, ButtonWithRef } from './Button';

export interface MenuButtonProps
  extends Omit<ButtonProps, 'onClick'>, AutomationTestingProps {
  items: Array<ReactNode>;
  menuClassName?: string;
  dropdownPosition?: 'left' | 'right';
  children: ReactNode;
  onClick?: () => void;
}

export function MenuButton({
  items,
  children,
  color = 'primary',
  size = 'small',
  disabled = false,
  className,
  title,
  icon,
  menuClassName,
  dropdownPosition = 'right',
  'data-cy': dataCy,
  onClick,
}: PropsWithChildren<MenuButtonProps>) {
  return (
    <Menu>
      <ReachMenuButton
        as={ButtonWithRef}
        color={color}
        size={size}
        disabled={disabled}
        className={clsx('flex items-center gap-1', className)}
        title={title}
        icon={icon}
        data-cy={dataCy}
        onClick={onClick}
      >
        {children}
        <Icon icon={ChevronDown} size="xs" className="ml-1" />
      </ReachMenuButton>

      <MenuList
        className={clsx(
          'dropdown-menu relative rounded-lg p-1!',
          'border border-solid! border-gray-6 shadow-[0_6px_12px_rgba(0,0,0,0.18)] th-highcontrast:border-gray-2 th-dark:border-gray-warm-8',
          {
            'right-0 origin-top-right': dropdownPosition === 'right',
            'left-0 origin-top-left': dropdownPosition === 'left',
          },
          menuClassName
        )}
      >
        {items}
      </MenuList>
    </Menu>
  );
}

interface MenuLinkProps extends AutomationTestingProps, RouteLinkProps {
  children: ReactNode;
  label?: string;
}

export function MenuButtonLink({
  to,
  children,
  label,
  params,
  'data-cy': dataCy,
}: MenuLinkProps) {
  const pathname = usePathname();
  const href = buildHref(to, params, pathname);
  return (
    <ReachMenuLink
      href={href}
      className={clsx(
        'decoration-none hover:decoration-none whitespace-nowrap rounded-md px-5 py-1 text-sm leading-5 text-(--text-dropdown-menu-color) hover:bg-(--bg-dropdown-hover) hover:text-(--text-dropdown-menu-color) hover:no-underline focus:bg-(--bg-dropdown-hover) focus:text-(--text-dropdown-menu-color) focus-visible:outline-hidden focus-visible:ring-0 th-highcontrast:text-(--text-dropdown-menu-color) hover:th-highcontrast:text-(--text-dropdown-menu-color) focus:th-highcontrast:text-(--text-dropdown-menu-color) th-dark:text-(--text-dropdown-menu-color) hover:th-dark:text-(--text-dropdown-menu-color) focus:th-dark:text-(--text-dropdown-menu-color)'
      )}
      aria-label={label}
      data-cy={dataCy}
    >
      {children}
    </ReachMenuLink>
  );
}
