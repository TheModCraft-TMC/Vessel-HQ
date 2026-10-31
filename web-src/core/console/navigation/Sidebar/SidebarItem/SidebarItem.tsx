import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Link } from '@console/navigation/Link';

import { Badge } from '@/ui/components/status/Badge';
import { Icon } from '@/ui/components/icons/Icon';

import { useSidebarState } from '../../../layout/SidebarState';

import { SidebarTooltip } from './SidebarTooltip';
import { useSidebarSrefActive } from './useSidebarSrefActive';
import { Wrapper } from './Wrapper';

interface Props {
  'data-cy'?: string;
  icon?: LucideIcon;
  to: string;
  params?: object;
  label: string;
  isSubMenu?: boolean;
  ignorePaths?: string[];
  includePaths?: string[];
  count?: number;
}

export function SidebarItem({
  icon,
  to,
  params,
  label,
  isSubMenu = false,
  ignorePaths = [],
  includePaths = [],
  count,
  'data-cy': dataCy,
}: Props) {
  const { isOpen } = useSidebarState();
  const anchorProps = useSidebarSrefActive(to, undefined, params, {
    ignorePaths,
    includePaths,
  });
  const anchor = (
    <ItemAnchor
      href={anchorProps.href}
      className={anchorProps.className}
      dataCy={dataCy}
      isOpen={isOpen}
      isSubMenu={isSubMenu}
      count={count}
    >
      {!!icon && <Icon icon={icon} className="flex [&>svg]:w-4" />}
      {(isOpen || isSubMenu) && <span>{label}</span>}
    </ItemAnchor>
  );

  if (isOpen || isSubMenu) {
    return <Wrapper label={label}>{anchor}</Wrapper>;
  }

  return (
    <Wrapper label={label}>
      <SidebarTooltip
        content={
          <ItemAnchor
            href={anchorProps.href}
            className={anchorProps.className}
            dataCy={dataCy}
            isOpen={isOpen}
            isSubMenu={isSubMenu}
            count={count}
          >
            <span className="px-3">{label}</span>
          </ItemAnchor>
        }
      >
        {anchor}
      </SidebarTooltip>
    </Wrapper>
  );
}

function ItemAnchor({
  href,
  className,
  isOpen,
  isSubMenu,
  dataCy,
  count,
  children,
}: PropsWithChildren<{
  href: string;
  className: string;
  isOpen: boolean;
  isSubMenu: boolean;
  dataCy?: string;
  count?: number;
}>) {
  return (
    <Link
      to={href}
      className={clsx(
        className,
        'text-inherit! no-underline hover:text-inherit! hover:no-underline! focus:text-inherit! focus:no-underline!',
        'flex h-8 w-full flex-1 items-center gap-4 rounded-md text-sm transition-colors duration-200 hover:bg-graphite-500',
        {
          'w-full justify-start px-3': isOpen || isSubMenu,
          'w-8 justify-center': !isOpen && !isSubMenu,
        }
      )}
      data-cy={dataCy}
    >
      {children}
      {(isOpen || isSubMenu) && count !== undefined && count > 0 && (
        <Badge type="info">{count > 99 ? '99+' : count}</Badge>
      )}
    </Link>
  );
}
