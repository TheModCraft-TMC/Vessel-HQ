import { useRouteParams } from '@console/console/routing/useRouteParams';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { buildHref } from '@console/console/routing/buildHref';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { useNamespacesQuery } from '../queries/useNamespacesQuery';

type RedirectOptions = {
  to: string;
  params?: Record<string, unknown>;
};

/**
 * Redirects away when the provided namespace is not in the allowed namespaces list for the current environment.
 */
export function useNamespaceAccessRedirect(
  namespace?: string,
  { to, params } = {
    to: '/:endpointId/kubernetes/dashboard',
    params: {},
  } as RedirectOptions
) {
  const router = useRouter();
  const pathname = usePathname();
  const namespaceInParams = useRouteParams().namespace;
  const currentNamespace = namespace || namespaceInParams;
  const environmentId = useEnvironmentId();

  const namespacesQuery = useNamespacesQuery(environmentId);

  useEffect(() => {
    if (!currentNamespace) {
      return;
    }

    if (namespacesQuery.isLoading || namespacesQuery.isFetching) {
      return;
    }

    const namespaces = namespacesQuery.data ?? [];
    const isAllowed = namespaces.some((ns) => ns.Name === currentNamespace);

    if (!isAllowed) {
      router.push(buildHref(to, params, pathname));
    }
  }, [
    currentNamespace,
    to,
    params,
    router,
    namespacesQuery.isLoading,
    namespacesQuery.isFetching,
    namespacesQuery.data,
  ]);
}
