import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';
import { useEffect } from 'react';

export function Redirect({ to, params = {} }: { to: string; params?: object }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    router.push(buildHref(to, params, pathname));
  }, [params, router, to]);
  return null;
}
