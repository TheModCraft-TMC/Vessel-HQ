import type {
  ContainerConfig,
  ContainerState,
  DriverData,
  ContainerSummary,
  HostConfig,
  MountPoint,
  NetworkSettings,
} from 'docker-types';
import type {
  Config,
  ConfigSpec,
  Node,
  NodeSpec,
  Secret,
  SecretSpec,
  Service,
  ServiceSpec,
  Task,
  Swarm,
} from 'docker-types';

import { PortainerDockerSnapshot } from '@api/types.gen';

// Raw Docker API contracts are intentionally re-exported only from the
// provider boundary. Consumers should not depend on docker-types directly.
export type {
  Config,
  ConfigSpec,
  ContainerConfig,
  ContainerState,
  DeviceMapping,
  DeviceRequest,
  DriverData,
  EngineDescription,
  EventMessage,
  HostConfig,
  HealthConfig,
  ImageInspect,
  ImageSummary,
  ManagerStatus,
  Mount,
  MountPoint,
  Node,
  NodeDescription,
  NodeSpec,
  NodeStatus,
  NetworkingConfig,
  NetworkSettings,
  NodeState,
  ObjectVersion,
  EndpointPortConfig,
  Platform,
  Plugin,
  PluginInterfaceType,
  PluginsInfo,
  PortMap,
  Resources,
  ResourceObject,
  RestartPolicy,
  Secret,
  SecretSpec,
  Service,
  ServiceSpec,
  SystemInfo,
  SystemVersion,
  Swarm,
  Task,
  TaskSpec,
  TaskState,
  Volume,
  VolumeCreateOptions,
} from 'docker-types';

/** Identifies a Portainer environment without coupling the provider to a domain model. */
export type EnvironmentId = number;

export type DockerServiceDto = Service;
export type DockerTaskDto = Task;
export type DockerConfigDto = Config;
export type DockerSecretDto = Secret;
export type DockerNodeDto = Node;
export type DockerSwarmDto = Swarm;
export type DockerServiceSpecDto = ServiceSpec;
export type DockerConfigSpecDto = ConfigSpec;
export type DockerSecretSpecDto = SecretSpec;
export type DockerNodeSpecDto = NodeSpec;

export interface DockerImageListDto {
  created: number;
  nodeName?: string;
  id: string;
  size: number;
  tags?: string[];
  used: boolean;
}

export interface DockerImageHistoryDto {
  Id: string;
  Created: number;
  CreatedBy: string;
  Tags: string[];
  Size: number;
  Comment: string;
}

export interface DockerImagePruneDto {
  ImagesDeleted: Array<{ Deleted?: string; Untagged?: string }> | null;
  SpaceReclaimed: number;
}

export interface DockerBuildPruneDto {
  CachesDeleted: string[] | null;
  SpaceReclaimed: number;
}

export interface DockerImageBuildLogDto {
  stream?: string;
  errorDetail?: { message: string };
}

export type DockerContainerSnapshot = DockerContainerDto & {
  Env: string[];
};

export type DockerSnapshotRaw = {
  Containers: DockerContainerSnapshot[];
  SnapshotTime: string;
};

/** API shape returned by the Docker environment snapshot endpoint. */
export type DockerSnapshotDto = PortainerDockerSnapshot;

type RequiredDockerContainerFields = Required<
  Pick<
    ContainerSummary,
    | 'Id'
    | 'Names'
    | 'Image'
    | 'ImageID'
    | 'Command'
    | 'Created'
    | 'Ports'
    | 'Labels'
    | 'State'
    | 'Status'
    | 'HostConfig'
    | 'Mounts'
  >
>;

export type DockerContainerDto = RequiredDockerContainerFields &
  Omit<ContainerSummary, keyof RequiredDockerContainerFields> & {
    Portainer?: {
      ResourceControl?: unknown;
      Agent?: { NodeName: string };
    };
    IsPortainer?: boolean;
  };

export interface DockerContainerListOptions {
  all?: boolean;
  filters?: unknown;
  nodeName?: string;
}

/** API shape returned by Docker's container inspect endpoint. */
export interface DockerContainerDetailsDto {
  Id?: string;
  Created?: string;
  Path?: string;
  Args?: string[];
  State?: ContainerState;
  Image?: string;
  ResolvConfPath?: string;
  HostnamePath?: string;
  HostsPath?: string;
  LogPath?: string;
  Name?: string;
  RestartCount?: number;
  Driver?: string;
  Platform?: string;
  MountLabel?: string;
  ProcessLabel?: string;
  AppArmorProfile?: string;
  ExecIDs?: string[] | null;
  HostConfig?: HostConfig;
  GraphDriver?: DriverData;
  SizeRw?: number;
  SizeRootFs?: number;
  Mounts?: MountPoint[];
  Config?: ContainerConfig;
  NetworkSettings?: NetworkSettings;
  Portainer?: {
    ResourceControl?: unknown;
    Agent?: { NodeName: string };
  };
  IsPortainer?: boolean;
}

/** API shape returned by Docker's container top endpoint. */
export interface DockerContainerProcessesDto {
  Processes: string[][];
  Titles: string[];
}

export interface DockerNetworkDto {
  Id: string;
  Name: string;
  Scope?: string;
  Driver?: string;
  EnableIPv6?: boolean;
  Internal?: boolean;
  Attachable?: boolean;
  Ingress?: boolean;
  ConfigOnly?: boolean;
  ConfigFrom?: { Network: string };
  IPAM?: {
    Driver?: string;
    Options?: Record<string, string>;
    Config?: Array<{
      Subnet?: string;
      Gateway?: string;
      IPRange?: string;
      AuxiliaryAddresses?: Record<string, string>;
    }>;
  };
  Options?: Record<string, string>;
  Labels?: Record<string, string>;
  Containers?: Record<
    string,
    {
      EndpointID?: string;
      IPv4Address?: string;
      IPv6Address?: string;
      MacAddress?: string;
      Name?: string;
    }
  >;
  Portainer?: {
    ResourceControl?: unknown;
    Agent?: { NodeName: string };
  };
  IsPortainer?: boolean;
}

export interface DockerNetworkListOptions {
  filters?: unknown;
  nodeName?: string;
}

export interface DockerNetworkCreateRequest {
  Name: string;
  CheckDuplicate?: boolean;
  Driver?: string;
  Internal?: boolean;
  Attachable?: boolean;
  Ingress?: boolean;
  IPAM?: unknown;
  EnableIPv6?: boolean;
  Options?: Record<string, string>;
  Labels?: Record<string, string>;
  ConfigOnly?: boolean;
  ConfigFrom?: { Network: string };
  Scope?: 'swarm' | 'local';
}

export interface DockerNetworkCreateResponse {
  Id: string;
  Warning: string;
}

export interface DockerNetworkConnectOptions {
  networkId: string;
  containerId: string;
  aliases?: string[];
  nodeName?: string;
}

export interface DockerNetworkDisconnectOptions {
  networkId: string;
  containerId: string;
  nodeName?: string;
}
