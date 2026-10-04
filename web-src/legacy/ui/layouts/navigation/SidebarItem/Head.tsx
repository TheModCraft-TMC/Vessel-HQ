import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ComponentProps } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { buildHref } from '@console/console/routing/buildHref';

import { IconProps, Icon } from '@/ui/components/icons/Icon';
import { Link } from '@/ui/components/links/Link';

import { useSidebarState } from '../useSidebarState';

interface Props extends IconProps, ComponentProps<typeof Link> {
  label: string;
  ignorePaths?: string[];
}

export function Head({
  to,
  params = {},
  label,
  icon,
  ignorePaths = [],
  'data-cy': dataCy,
}: Props) {
  const { isOpen } = useSidebarState();
  const anchorProps = useSrefActive(
    to,
    'bg-blue-8 be:bg-gray-8 th-dark:bg-gray-true-8',
    params,
    ignorePaths
  );

  const anchor = (
    <a
      href={anchorProps.href}
      className={clsx(
        anchorProps.className,
        'text-inherit no-underline hover:text-inherit hover:no-underline focus:text-inherit focus:no-underline',
        'flex h-8 w-full flex-1 items-center space-x-4 rounded-md text-sm',
        'transition-colors duration-200 hover:bg-blue-9 be:hover:bg-gray-9 th-dark:hover:bg-gray-true-9',
        {
          'w-full justify-start px-3': isOpen,
          'w-8 justify-center': !isOpen,
        }
      )}
      data-cy={dataCy}
    >
      {!!icon && <Icon icon={icon} className={clsx('flex [&>svg]:w-4')} />}
      {isOpen && <span>{label}</span>}
    </a>
  );

  if (isOpen) return anchor;

  return (
    <Tippy
      className="!rounded-md bg-blue-9 !px-3 !py-2 !opacity-100 be:bg-gray-9 th-dark:bg-gray-true-9"
      content={label}
      delay={[0, 0]}
      duration={[0, 0]}
      zIndex={1000}
      placement="right"
      arrow
      allowHTML
      interactive
    >
      {anchor}
    </Tippy>
  );
}

function useSrefActive(
  to: string,
  activeClassName: string,
  params: Partial<Record<string, string>> = {},
  ignorePaths: string[] = []
) {
  const pathname = usePathname();
  const href = buildHref(to, params, pathname);
  const target = href.split('?')[0];
  const anchorProps = {
    href,
    className:
      pathname === target || pathname.startsWith(`${target}/`)
        ? activeClassName
        : '',
  };

  const className = ignorePaths.some((path) => {
    const target = buildHref(path, params, pathname).split('?')[0];
    return pathname === target || pathname.startsWith(`${target}/`);
  })
    ? ''
    : anchorProps.className;

  return {
    ...anchorProps,
    className,
  };
}
