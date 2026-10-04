/** Public entry point for Kubernetes ingress workflows. */

export { CreateIngressView } from './ingresses/CreateIngressView/CreateIngressView';
export { IngressesDatatableView } from './ingresses/IngressDatatable';
export { useIngressControllers, useIngresses } from './ingresses/queries';
export { updateIngress } from './ingresses/service';
export type { Ingress } from './ingresses/types';
