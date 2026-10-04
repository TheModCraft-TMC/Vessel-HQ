import { NetworkViewModel } from '@/domains/networks/models/network-view-model';

export type DecoratedNetwork = NetworkViewModel & {
  Subs: DecoratedNetwork[];
  IPAM: NetworkViewModel['IPAM'] & {
    IPV4Configs?: Array<NetworkViewModel['IPAM']['Config'][number]>;
    IPV6Configs?: Array<NetworkViewModel['IPAM']['Config'][number]>;
  };
};
