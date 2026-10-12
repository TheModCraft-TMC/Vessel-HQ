import type { DockerContainerDto } from '@/providers/infrastructure/docker';
import type { ResourceControlViewModel } from '@/domains/access-control';

export enum ContainerStatus {
  Paused = 'paused',
  Stopped = 'stopped',
  Created = 'created',
  Healthy = 'healthy',
  Unhealthy = 'unhealthy',
  Starting = 'starting',
  Running = 'running',
  Dead = 'dead',
  Exited = 'exited',
  Restarting = 'restarting',
  Removing = 'removing',
}

export type QuickAction = 'attach' | 'exec' | 'inspect' | 'logs' | 'stats';

export interface Port {
  host?: string;
  public: number;
  private: number;
}

export type ContainerId = string;

type DecoratedDockerContainer = {
  NodeName: string;
  ResourceControl?: ResourceControlViewModel;
  IP: string;
  StackName?: string;
  Status: ContainerStatus;
  Ports: Port[];
  StatusText: string;
  Gpus: string;
};

export type ContainerListViewModel = DecoratedDockerContainer &
  Omit<DockerContainerDto, keyof DecoratedDockerContainer | 'Portainer'> & {
    Portainer?: unknown;
  };

export type ContainerLogsParams = {
  stdout?: boolean;
  stderr?: boolean;
  timestamps?: boolean;
  since?: number;
  tail?: number;
};
