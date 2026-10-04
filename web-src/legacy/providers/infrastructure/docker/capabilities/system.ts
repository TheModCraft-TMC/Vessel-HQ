import type { DockerSystemInfo } from '../dto/system';

export interface DockerSystemCapabilities {
  isWindows: boolean;
  isStandalone: boolean;
  isSwarm: boolean;
  isSwarmManager: boolean;
  maxCpu: number;
  maxMemory: number;
}

export function getDockerSystemCapabilities(
  info: DockerSystemInfo
): DockerSystemCapabilities {
  return {
    isWindows: info.OSType === 'windows',
    isStandalone: !info.Swarm?.NodeID,
    isSwarm: !!info.Swarm?.NodeID,
    isSwarmManager: !!info.Swarm?.NodeID && !!info.Swarm.ControlAvailable,
    maxCpu: info.NCPU || 32,
    maxMemory: info.MemTotal ? Math.floor(info.MemTotal / 1000 / 1000) : 32768,
  };
}
