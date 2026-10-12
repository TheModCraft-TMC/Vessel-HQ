export const KubernetesPortainerConfigMapNamespace = 'portainer';
export const KubernetesPortainerConfigMapConfigName = 'portainer-config';
export const KubernetesPortainerConfigMapAccessKey = 'NamespaceAccessPolicies';

export function KubernetesPortainerAccessConfigMap() {
  return {
    Id: 0,
    Name: KubernetesPortainerConfigMapConfigName,
    Namespace: KubernetesPortainerConfigMapNamespace,
    Data: {} as Record<string, string>,
  };
}

export class KubernetesConfigMap {
  Id: number | string = 0;

  Name = '';

  Namespace = '';

  Yaml = '';

  ConfigurationOwner = '';

  Data: unknown[] = [];

  Labels: Record<string, string> = {};
}
