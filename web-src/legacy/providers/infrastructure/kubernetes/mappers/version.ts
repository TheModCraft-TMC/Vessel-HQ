import { KubernetesVersionDto } from '../dto/version';

export function mapKubernetesVersion(dto: KubernetesVersionDto) {
  return {
    major: dto.major ?? '',
    minor: dto.minor ?? '',
    gitVersion: dto.gitVersion ?? '',
    gitCommit: dto.gitCommit ?? '',
    gitTreeState: dto.gitTreeState ?? '',
    buildDate: dto.buildDate ?? '',
    goVersion: dto.goVersion ?? '',
    compiler: dto.compiler ?? '',
    platform: dto.platform ?? '',
    supportsPodRestart: dto.supportsPodRestart ?? false,
  };
}
