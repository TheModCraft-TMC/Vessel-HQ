import type {
  ContainerConfig,
  ContainerState,
  DriverData,
  HostConfig,
  MountPoint,
  NetworkSettings,
} from '@/providers/infrastructure/docker';
import type { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

/** Stable domain representation of a Docker container inspect response. */
export interface ContainerDetails {
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
  ResourceControl?: ResourceControlViewModel;
  IsPortainer?: boolean;
}

export class ContainerDetailsViewModel {
  Model: ContainerDetails;
  Id: ContainerDetails['Id'];
  State: ContainerDetails['State'];
  Created: ContainerDetails['Created'];
  Name: ContainerDetails['Name'];
  NetworkSettings: ContainerDetails['NetworkSettings'];
  Args: ContainerDetails['Args'];
  Image: ContainerDetails['Image'];
  Config: ContainerDetails['Config'];
  HostConfig: ContainerDetails['HostConfig'];
  Mounts: ContainerDetails['Mounts'];
  ResourceControl?: ResourceControlViewModel;
  IsPortainer?: ContainerDetails['IsPortainer'];

  constructor(data: ContainerDetails) {
    this.Model = data;
    this.Id = data.Id;
    this.State = data.State;
    this.Created = data.Created;
    this.Name = data.Name;
    this.NetworkSettings = data.NetworkSettings;
    this.Args = data.Args;
    this.Image = data.Image;
    this.Config = data.Config;
    this.HostConfig = data.HostConfig;
    this.Mounts = data.Mounts;
    this.ResourceControl = data.ResourceControl;
    this.IsPortainer = data.IsPortainer;
  }
}

export type ContainerHealth = NonNullable<
  NonNullable<ContainerDetails['State']>['Health']
>;
export type ContainerMount = NonNullable<ContainerDetails['Mounts']>[number];
export type ContainerDeviceRequest = NonNullable<
  NonNullable<ContainerDetails['HostConfig']>['DeviceRequests']
>[number];
export type ContainerPortMap = NonNullable<
  NonNullable<ContainerDetails['HostConfig']>['PortBindings']
>;
export type ContainerNetworkSettings = NonNullable<
  ContainerDetails['NetworkSettings']
>;
export type ContainerNetwork = NonNullable<
  NonNullable<ContainerNetworkSettings['Networks']>[string]
>;
