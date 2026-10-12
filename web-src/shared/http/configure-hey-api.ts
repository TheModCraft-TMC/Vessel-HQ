import type { CreateClientConfig } from '@api/client.gen';

import axios from './client';

export function createClientConfig(config: Parameters<CreateClientConfig>[0]) {
  return {
    ...config,
    axios,
  };
}
