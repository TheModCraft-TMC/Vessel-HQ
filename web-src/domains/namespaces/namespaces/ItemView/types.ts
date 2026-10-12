import { KubernetesApplication } from '@/core/kubernetes/models/application/models';

export interface NamespaceApp extends KubernetesApplication {
  CPU: number;
  Memory: number;
}
