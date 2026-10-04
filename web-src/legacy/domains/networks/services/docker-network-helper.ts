import { getIPv4Configs, getIPv6Configs } from '../models/network-helper';
import type { IPConfig } from '../models/network';

export default class DockerNetworkHelper {
  static getIPV4Configs(configs: IPConfig[] = []) {
    return getIPv4Configs(configs);
  }

  static getIPV6Configs(configs: IPConfig[] = []) {
    return getIPv6Configs(configs);
  }
}
