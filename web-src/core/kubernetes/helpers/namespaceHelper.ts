import { KUBERNETES_DEFAULT_SYSTEM_NAMESPACES } from '@/core/kubernetes/models/namespace/models';
import { isSystem } from '@/core/kubernetes/store/namespace';
import { isDefaultNamespace } from '@/domains/namespaces';

export default class KubernetesNamespaceHelper {
  static isSystemNamespace(namespace: string) {
    return isSystem(namespace);
  }

  static isDefaultNamespace(namespace: string) {
    return isDefaultNamespace(namespace);
  }

  static isDefaultSystemNamespace(namespace: string) {
    return KUBERNETES_DEFAULT_SYSTEM_NAMESPACES.includes(namespace);
  }
}
