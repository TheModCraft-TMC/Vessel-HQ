/** Public entry point for Kubernetes namespace workflows. */

export { AccessView } from './namespaces/AccessView/AccessView';
export { CreateNamespaceView } from './namespaces/CreateView/CreateNamespaceView';
export { NamespaceView } from './namespaces/ItemView/NamespaceView';
export { NamespacesView } from './namespaces/ListView/NamespacesView';

export { useNamespaceAccessRedirect } from './namespaces/hooks/useNamespaceAccessRedirect';
export { queryKeys as namespaceQueryKeys } from './namespaces/queries/queryKeys';
export {
  isSystemNamespace,
  useIsSystemNamespace,
} from './namespaces/queries/useIsSystemNamespace';
export { useNamespaceQuery } from './namespaces/queries/useNamespaceQuery';
export { useNamespacesQuery } from './namespaces/queries/useNamespacesQuery';
export { convertBase2ToMiB } from './namespaces/resourceQuotaUtils';
export type { Namespaces, PortainerNamespace } from './namespaces/types';
