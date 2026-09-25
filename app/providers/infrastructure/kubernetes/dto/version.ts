export interface KubernetesVersionDto {
  major?: string;
  minor?: string;
  gitVersion?: string;
  gitCommit?: string;
  gitTreeState?: string;
  buildDate?: string;
  goVersion?: string;
  compiler?: string;
  platform?: string;
  supportsPodRestart?: boolean;
}
