import { ResourceControlOwnership } from '@/react/portainer/access-control/types';

export type IPConfig = {
  Subnet: string;
  Gateway?: string;
  IPRange?: string;
  AuxiliaryAddresses?: Record<string, string>;
};

export type NetworkId = string;

export type NetworkOptions = Record<string, string>;

type IpamOptions = Record<string, string> | undefined;

export type NetworkResponseContainer = {
  EndpointID: string;
  IPv4Address: string;
  IPv6Address: string;
  MacAddress: string;
  Name: string;
};

export interface NetworkContainer extends NetworkResponseContainer {
  Id: string;
}

export type NetworkResponseContainers = Record<
  string,
  NetworkResponseContainer
>;

export interface DockerNetwork {
  Name: string;
  Id: NetworkId;
  Driver: string;
  Scope: string;
  Attachable: boolean;
  Internal: boolean;
  IPAM: {
    Config: IPConfig[];
    Driver: string;
    Options: IpamOptions;
  };
  Options: NetworkOptions;
  Containers: NetworkResponseContainers;
  Ingress?: boolean;
  Labels?: Record<string, string>;
  ConfigFrom?: { Network: string };
  ConfigOnly?: boolean;
  Portainer?: {
    ResourceControl?: {
      Id?: number;
      System?: boolean;
      Ownership?: ResourceControlOwnership;
      [key: string]: unknown;
    };
    Agent?: { NodeName: string };
  };
  IsPortainer?: boolean;
}
