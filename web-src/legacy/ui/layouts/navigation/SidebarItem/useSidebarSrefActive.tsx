import { usePathname } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

export type PathOptions = {
  /** ignorePaths ignores highlighting the sidebar parent when the URL of a sidebar child matches the current URL */
  ignorePaths?: string[];
  /** includePaths help to highlight the sidebar parent when the URL of a sidebar child matches the current URL */
  includePaths?: string[];
};

/**
 * Extends useSrefActive by ignoring or including paths and updating the classNames field returned when a child route is active.
 * @param to The route to match
 * @param activeClassName The active class names to return
 * @param params The route params
 * @param pathOptions The paths to ignore/include
 */
export function useSidebarSrefActive(
  to: string,
  // default values are the classes used in the sidebar for an active item
  activeClassName: string = 'bg-graphite-500',
  params: Partial<Record<string, string>> = {},
  pathOptions: PathOptions = {
    ignorePaths: [],
    includePaths: [],
  }
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

  // overwrite the className to '' if the the current route is in ignorePaths
  const isIgnorePathInRoute = pathOptions.ignorePaths?.some((path) =>
    isRouteActive(pathname, path, params)
  );
  if (isIgnorePathInRoute) {
    return { ...anchorProps, className: '' };
  }

  // overwrite the className to activeClassName if the the current route is in includePaths
  const isIncludePathInRoute = pathOptions.includePaths?.some((path) =>
    isRouteActive(pathname, path, params)
  );
  if (isIncludePathInRoute) {
    return { ...anchorProps, className: activeClassName };
  }

  return anchorProps;
}

function isRouteActive(
  pathname: string,
  route: string,
  params: Partial<Record<string, string>>
) {
  const target = buildHref(route, params, pathname).split('?')[0];
  return pathname === target || pathname.startsWith(`${target}/`);
}
