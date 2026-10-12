import { DockerNetwork } from '@/domains/networks';

import { ContainerDetailsJSON } from '../../../queries/useContainer';
import { ContainerListViewModel } from '../../../types';

import { CONTAINER_MODE, Values } from './types';

export function getDefaultViewModel(
  isWindows: boolean,
  defaultNetworkName = 'bridge'
) {
  const networkMode = getDefaultNetworkMode(isWindows, defaultNetworkName);
  return {
    networkMode,
    hostname: '',
    domain: '',
    macAddress: '',
    ipv4Address: '',
    ipv6Address: '',
    primaryDns: '',
    secondaryDns: '',
    hostsFileEntries: [],
    container: '',
  };
}

export function getDefaultNetworkMode(
  isWindows: boolean,
  defaultNetworkName = 'bridge'
) {
  if (isWindows) return 'nat';
  if (defaultNetworkName !== 'bridge') return defaultNetworkName;
  return 'bridge';
}

export function toViewModel(
  config: ContainerDetailsJSON,
  networks: Array<DockerNetwork>,
  runningContainers: Array<ContainerListViewModel> = [],
  defaultNetworkName = 'bridge'
): Values {
  const dns = config.HostConfig?.Dns;
  const [primaryDns = '', secondaryDns = ''] = dns || [];

  const hostsFileEntries = config.HostConfig?.ExtraHosts || [];

  const [networkMode, container = ''] = getNetworkMode(
    config,
    networks,
    runningContainers,
    defaultNetworkName
  );

  const networkSettings = config.NetworkSettings?.Networks?.[networkMode];
  let ipv4Address = '';
  let ipv6Address = '';
  if (networkSettings && networkSettings.IPAMConfig) {
    ipv4Address = networkSettings.IPAMConfig.IPv4Address || '';
    ipv6Address = networkSettings.IPAMConfig.IPv6Address || '';
  }

  return {
    networkMode,
    hostname: config.Config?.Hostname || '',
    domain: config.Config?.Domainname || '',
    macAddress: '', // mac address is cleared between edit/duplicate
    ipv4Address,
    ipv6Address,
    primaryDns,
    secondaryDns,
    hostsFileEntries,
    container,
  };
}

export function getNetworkMode(
  config: ContainerDetailsJSON,
  networks: Array<DockerNetwork>,
  runningContainers: Array<ContainerListViewModel> = [],
  defaultNetworkName = 'bridge'
) {
  let networkMode = config.HostConfig?.NetworkMode || '';
  if (!networkMode) {
    const networks = Object.keys(config.NetworkSettings?.Networks || {});
    if (networks.length > 0) {
      [networkMode] = networks;
    }
  }

  if (networkMode.startsWith('container:')) {
    const networkContainerId = networkMode.split(/^container:/)[1];
    const container =
      runningContainers.find((c) => c.Id === networkContainerId)?.Names[0] ||
      '';
    return [CONTAINER_MODE, container] as const;
  }

  const networkNames = networks.map((n) => n.Name);

  if (networkNames.includes(networkMode)) {
    if (defaultNetworkName !== 'bridge' && networkMode === 'bridge') {
      return [defaultNetworkName] as const;
    }
    return [networkMode] as const;
  }

  if (
    networkNames.includes('bridge') &&
    (!networkMode || networkMode === 'default' || networkMode === 'bridge')
  ) {
    if (defaultNetworkName !== 'bridge') {
      return [defaultNetworkName] as const;
    }
    return ['bridge'] as const;
  }

  if (networkNames.includes('nat')) {
    return ['nat'] as const;
  }

  return [networks[0].Name] as const;
}
