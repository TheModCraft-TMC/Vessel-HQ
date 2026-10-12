export class KubernetesPortMappingPort {
  Port: number | string = 0;

  TargetPort: number | string = 0;

  Protocol = '';

  IngressRules: unknown[] = [];
}

export class KubernetesPortMapping {
  Name = '';

  Expanded = false;

  Highlighted = false;

  ResourcePool = '';

  ServiceType = '';

  ApplicationOwner = '';

  LoadBalancerIPAddress = '';

  Ports: KubernetesPortMappingPort[] = [];
}
