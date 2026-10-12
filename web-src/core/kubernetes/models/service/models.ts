export const KubernetesServiceHeadlessPrefix = 'headless-';
export const KubernetesServiceHeadlessClusterIP = 'None';
export const KubernetesServiceTypes = {
  LOAD_BALANCER: 'LoadBalancer',
  NODE_PORT: 'NodePort',
  CLUSTER_IP: 'ClusterIP',
  INGRESS: 'Ingress',
} as const;

class BaseKubernetesService {
  Headless = false;

  Namespace = '';

  Name = '';

  StackName = '';

  Ports: KubernetesServicePort[] = [];

  Type = '';

  ClusterIP = '';

  ApplicationName = '';

  ApplicationOwner = '';

  Note = '';
}

export class KubernetesService extends BaseKubernetesService {
  Ingress = false;

  Selector: Record<string, string> = {};

  nodePortError = false;

  servicePortError = false;
}

export class KubernetesIngressService extends BaseKubernetesService {
  Ingress = true;

  IngressRoute: unknown[] = [];
}

export class KubernetesServicePort {
  name = '';

  port = 0;

  targetPort: number | string = 0;

  protocol = '';

  nodePort = 0;

  ingress = '';
}
