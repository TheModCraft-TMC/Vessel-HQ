import { NetworkId } from '@/domains/networks';

import { ContainerStatus } from '../types';

export type { ContainerProcesses } from '../models';

export interface Filters {
  label?: string[];
  name?: string[];
  network?: NetworkId[];
  status?: ContainerStatus[];
  volume?: string[];
}
