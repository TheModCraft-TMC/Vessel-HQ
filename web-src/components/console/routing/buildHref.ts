type RouteParams = object;

export type RouteLinkProps = {
  to: string;
  params?: object;
  className?: string;
};

export function buildHref(
  target: string,
  params: RouteParams = {},
  pathname: string | null = '/'
) {
  const currentPathname = pathname || '/';
  const values: Record<string, unknown> = {
    ...inferPathParams(currentPathname),
    ...(params as Record<string, unknown>),
  };
  const pattern = resolvePath(target, currentPathname);

  const consumed = new Set<string>();
  const path = pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => {
    consumed.add(key);
    const value = values[key];
    return encodeURIComponent(String(value ?? ''));
  });
  const query = new URLSearchParams();
  let hash = '';

  for (const [key, value] of Object.entries(params)) {
    if (key === '#') {
      hash =
        value == null || value === ''
          ? ''
          : `#${encodeURIComponent(String(value))}`;
    } else if (!consumed.has(key) && value != null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => query.append(key, String(item)));
      } else {
        query.set(key, String(value));
      }
    }
  }

  const search = query.toString();
  return `${path}${search ? `?${search}` : ''}${hash}`;
}

function inferPathParams(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (['docker', 'kubernetes', 'azure'].includes(segments[1])) {
    return { endpointId: segments[0] };
  }
  return {};
}

function resolvePath(target: string, pathname: string) {
  if (!target) return pathname;
  if (target.startsWith('/')) return target;
  if (target === '..') {
    const parent = pathname.split('/').filter(Boolean).slice(0, -1);
    return `/${parent.join('/')}`;
  }
  if (target.startsWith('./')) {
    return `${pathname.replace(/\/$/, '')}/${target.slice(2)}`;
  }
  return target;
}
