import { MenuLink as ReachMenuLink } from '@reach/menu-button';
import { UISrefProps, useSref } from '@uirouter/react';
import clsx from 'clsx';
import { UserIcon, ChevronDown } from 'lucide-react';

import { Menu, MenuButton, MenuList } from '@/ui/components/menu';
import { useLayoutBindings } from '@/ui/layouts/layout-context';

import styles from './HeaderTitle.module.css';
import { ThemeSelector } from './UserMenuThemeSelector';

export function UserMenu() {
  const { user, clearQueries } = useLayoutBindings();

  return (
    <Menu>
      <MenuButton
        className={clsx(
          'ml-auto flex items-center gap-1 self-start',
          styles.menuButton
        )}
        data-cy="userMenu-button"
        aria-label="User menu toggle"
      >
        <div
          className={clsx(
            styles.menuIcon,
            'icon-badge mr-1 !p-2 text-lg',
            'text-gray-8',
            'th-dark:text-gray-warm-7'
          )}
        >
          <UserIcon className="lucide" />
        </div>
        {user && <span>{user.Username}</span>}
        <ChevronDown className={styles.arrowDown} />
      </MenuButton>

      <MenuList
        className={styles.menuList}
        aria-label="User Menu"
        data-cy="userMenu"
      >
        <MenuLink
          to="portainer.account"
          label="My account"
          clearQueries={clearQueries}
          data-cy="userMenu-myAccount"
        />

        <MenuLink
          to="portainer.logout"
          label="Log out"
          clearQueries={clearQueries}
          data-cy="userMenu-logOut"
        />

        <hr className="my-1 border-t border-gray-5 th-highcontrast:border-gray-7 th-dark:border-gray-7" />

        <ThemeSelector user={user} />
      </MenuList>
    </Menu>
  );
}

interface MenuLinkProps extends UISrefProps {
  label: string;
  'data-cy'?: string;
  clearQueries(): void;
}

function MenuLink({
  to,
  label,
  params,
  options,
  'data-cy': dataCy,
  clearQueries,
}: MenuLinkProps) {
  const anchorProps = useSref(to, params, options);

  return (
    <ReachMenuLink
      href={anchorProps.href}
      onClick={(e: React.MouseEvent) => {
        clearQueries();
        anchorProps.onClick(e);
      }}
      className={styles.menuLink}
      aria-label={label}
      data-cy={dataCy}
    >
      {label}
    </ReachMenuLink>
  );
}
