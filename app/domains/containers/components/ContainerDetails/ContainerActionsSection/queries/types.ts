import { NetworkId } from '@/domains/networks';

import { ContainerStatus } from '../../../../types';

export interface Filters {
  label?: string[];
  name?: string[];
  network?: NetworkId[];
  status?: ContainerStatus[];
  volume?: string[];
}
