export class KubernetesIngressHelper {
  static findSBoundServiceIngressesRules<
    TRule extends { ServiceName?: string },
  >(ingresses: Array<{ Paths?: TRule[] }>, serviceName: string): TRule[] {
    const rules = ingresses.flatMap((ingress) => ingress.Paths ?? []);
    return rules.filter((rule) => rule.ServiceName === serviceName);
  }
}
