import { NetworkId } from '@/react/docker/networks/types';

import { ContainerStatus } from '../types';

export interface Filters {
  label?: string[];
  name?: string[];
  network?: NetworkId[];
  status?: ContainerStatus[];
  volume?: string[];
}

export type ContainerProcesses = {
  Processes: Array<Array<string>>;
  Titles: Array<string>;
};
