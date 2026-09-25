export interface KubernetesApiResourceDto {
  name?: string;
  singularName?: string;
  namespaced?: boolean;
  kind?: string;
  verbs?: string[];
}

export interface KubernetesApiResourceListDto {
  groupVersion?: string;
  resources?: KubernetesApiResourceDto[];
}
