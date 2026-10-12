import { useSyncExternalStore } from 'react';

type NavigationConfig = {
  pathname?: string;
  searchParams?: Record<string, unknown>;
  onReplace?: (url: string, options?: { scroll?: boolean }) => void;
};

let pathname = '/';
let search = '';
let replaceObserver: NavigationConfig['onReplace'];
const listeners = new Set<() => void>();

export function configureTestNavigation({
  pathname: nextPathname = '/',
  searchParams = {},
  onReplace,
}: NavigationConfig = {}) {
  pathname = nextPathname;
  search = new URLSearchParams(
    Object.entries(searchParams).map(([key, value]) => [key, String(value)])
  ).toString();
  replaceObserver = onReplace;
  emitChange();
}

const router = {
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  replace(url: string, options?: { scroll?: boolean }) {
    replaceObserver?.(url, options);
    const parsed = new URL(url, 'http://test.local');
    pathname = parsed.pathname;
    search = parsed.searchParams.toString();
    emitChange();
  },
};

export function notFound(): never {
  throw new Error('NEXT_NOT_FOUND');
}

export function redirect(url: string): never {
  throw new Error(`NEXT_REDIRECT:${url}`);
}

export function useParams() {
  return { endpointId: '1' };
}

export function usePathname() {
  return useSyncExternalStore(subscribe, () => pathname, () => pathname);
}

export function useRouter() {
  return router;
}

export function useSearchParams() {
  const value = useSyncExternalStore(subscribe, () => search, () => search);
  return new URLSearchParams(value);
}

export function useSelectedLayoutSegment() {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}
