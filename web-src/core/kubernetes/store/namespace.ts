import type { KubernetesNamespace } from '../models/namespace/models';

const storeNamespaces: Record<string, KubernetesNamespace> = {};

export function isSystem(name: string) {
  return storeNamespaces[name]?.IsSystem ?? false;
}

export function updateNamespaces(namespaces: KubernetesNamespace[]) {
  namespaces.forEach((namespace) => {
    storeNamespaces[namespace.Name] = namespace;
  });
}
