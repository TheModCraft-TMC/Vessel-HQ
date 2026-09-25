/**
 * Snapshot summary exposed as part of an environment.
 *
 * Docker transport and raw container shapes belong to the Docker provider;
 * this model contains only the data environment consumers need.
 */
export interface DockerSnapshot {
  ContainerCount: number;
  DiagnosticsData?: {
    DNS?: Record<string, string>;
    Log?: string;
    Proxy?: Record<string, string>;
    Telnet?: Record<string, string>;
  };
  DockerVersion: string;
  GpuUseAll: boolean;
  GpuUseList: string[];
  HealthyContainerCount: number;
  ImageCount: number;
  IsPodman: boolean;
  NodeCount: number;
  PerformanceMetrics?: {
    CPUUsage?: number;
    DiskUsage?: number;
    MemoryUsage?: number;
    NetworkUsage?: number;
  };
  RunningContainerCount: number;
  ServiceCount: number;
  StackCount: number;
  StoppedContainerCount: number;
  Swarm: boolean;
  Time: number;
  TotalCPU: number;
  TotalMemory: number;
  UnhealthyContainerCount: number;
  VolumeCount: number;
}
