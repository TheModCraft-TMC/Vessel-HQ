import { usePathname } from 'next/navigation';
import { buildHref } from '@console/routing/buildHref';

export type PathOptions = {
  ignorePaths?: string[];
  includePaths?: string[];
};

export function useSidebarSrefActive(
  to: string,
  activeClassName = 'bg-graphite-500',
  params: object = {},
  pathOptions?: PathOptions
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

  if (
    pathOptions?.ignorePaths?.some((path) =>
      isRouteActive(pathname, path, params)
    )
  ) {
    return { ...anchorProps, className: '' };
  }

  if (
    pathOptions?.includePaths?.some((path) =>
      isRouteActive(pathname, path, params)
    )
  ) {
    return { ...anchorProps, className: activeClassName };
  }

  return anchorProps;
}

function isRouteActive(pathname: string, route: string, params: object) {
  const target = buildHref(route, params, pathname).split('?')[0];
  return pathname === target || pathname.startsWith(`${target}/`);
}
