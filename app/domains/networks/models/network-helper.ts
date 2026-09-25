import type { IPConfig } from './network';

const systemNetworks = ['host', 'bridge', 'ingress', 'nat', 'none'];

export function isSystemNetwork(networkName: string) {
  return systemNetworks.includes(networkName);
}

export function getIPv4Configs(configs: IPConfig[] = []) {
  return configs.filter((config) =>
    /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/.test(
      config.Subnet
    )
  );
}

export function getIPv6Configs(configs: IPConfig[] = []) {
  return configs.filter((config) => !getIPv4Configs(configs).includes(config));
}
