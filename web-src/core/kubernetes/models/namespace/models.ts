export class KubernetesNamespace {
  Id: string;
  Name: string;
  CreationDate: string;
  Status: string;
  Yaml: string;
  ResourcePoolName: string;
  ResourcePoolOwner: string;
  IsSystem: boolean;

  constructor() {
    this.Id = '';
    this.Name = '';
    this.CreationDate = '';
    this.Status = '';
    this.Yaml = '';
    this.ResourcePoolName = '';
    this.ResourcePoolOwner = '';
    this.IsSystem = false;
  }
}

export const KUBERNETES_DEFAULT_SYSTEM_NAMESPACES = [
  'kube-system',
  'kube-public',
  'kube-node-lease',
  'portainer',
];
