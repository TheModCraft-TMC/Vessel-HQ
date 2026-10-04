'use client';

import { AnchorHTMLAttributes, MouseEvent, PropsWithChildren } from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  'data-cy': string;
  to: string;
  params?: object;
}

export function Link({
  children,
  'data-cy': dataCy,
  to,
  params,
  title,
  onClick: onClickProp,
  ...props
}: PropsWithChildren<Props>) {
  const pathname = usePathname();
  const href = buildHref(to, params, pathname);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClickProp?.(event);
  }

  return (
    <NextLink
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      onClick={handleClick}
      href={href}
      data-cy={dataCy}
      title={title}
    >
      {children}
    </NextLink>
  );
}
