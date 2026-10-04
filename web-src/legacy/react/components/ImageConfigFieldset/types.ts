import { Registry } from '@/domains/registries';

export interface Values {
  useRegistry: boolean;
  registryId?: Registry['Id'];
  image: string;
}
