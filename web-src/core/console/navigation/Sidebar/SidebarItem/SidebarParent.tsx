import clsx from 'clsx';
import { type PropsWithChildren, useState } from 'react';
import { Link } from '@console/navigation/Link';

import { CollapseExpandButton } from '@/ui/components/feedback/CollapseExpandButton';
import { Icon, type IconSource } from '@/ui/components/icons/Icon';

import { useSidebarState } from '../../../layout/SidebarState';

import { SidebarTooltip } from './SidebarTooltip';
import {
  type PathOptions,
  useSidebarSrefActive,
} from './useSidebarSrefActive';
import { Wrapper } from './Wrapper';

export function SidebarParent({
  children,
  icon,
  label,
  to,
  params,
  pathOptions,
  listId,
  'data-cy': dataCy,
}: PropsWithChildren<{
  label: string;
  icon: IconSource;
  to: string;
  pathOptions?: PathOptions;
  params?: object;
  listId: string;
  'data-cy'?: string;
}>) {
  const anchorProps = useSidebarSrefActive(to, undefined, params, pathOptions);
  const { isOpen } = useSidebarState();
  const [isExpanded, setIsExpanded] = useState(!!anchorProps.className);
  const parentContent = (
    <div
      className={clsx(
        'flex h-8 w-full items-center rounded-md transition-colors duration-200 ease-in-out hover:bg-graphite-500',
        (!isOpen || !isExpanded) && anchorProps.className
      )}
      data-cy={dataCy}
    >
      <Link
        to={to}
        params={params}
        className={clsx(
          'flex h-full flex-1 list-none items-center border-none text-inherit! hover:text-inherit! hover:no-underline focus:text-inherit! focus:no-underline!',
          isOpen ? 'justify-start pl-3' : 'justify-center'
        )}
        data-cy={`${dataCy}-link`}
      >
        <Icon icon={icon} />
        {isOpen && <span className="pl-4">{label}</span>}
      </Link>
      {isOpen && (
        <CollapseExpandButton
          isExpanded={isExpanded}
          onClick={() => setIsExpanded((value) => !value)}
          aria-controls={listId}
          data-cy="expand-button"
          className="group flex h-8 flex-none items-center border-none bg-transparent px-3 py-0"
        />
      )}
    </div>
  );
  const childList = (
    <ul
      id={listId}
      className={clsx('pl-11! text-white', {
        hidden: !isExpanded,
        block: isExpanded,
      })}
    >
      {children}
    </ul>
  );

  if (isOpen) {
    return (
      <>
        <Wrapper className="flex flex-col">{parentContent}</Wrapper>
        {childList}
      </>
    );
  }

  return (
    <Wrapper className="flex flex-col">
      <SidebarTooltip
        content={
          <ul>
            <li className="mb-1 flex items-center space-x-2 text-sm">
              <span>{label}</span>
            </li>
            {children}
          </ul>
        }
      >
        {parentContent}
      </SidebarTooltip>
    </Wrapper>
  );
}
