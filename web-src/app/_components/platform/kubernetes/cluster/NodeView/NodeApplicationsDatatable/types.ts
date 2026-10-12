import { KubernetesApplication } from '@/core/kubernetes/models/application/models';

export type NodeApplication = KubernetesApplication & {
  CPU: number;
  Memory: number;
};
