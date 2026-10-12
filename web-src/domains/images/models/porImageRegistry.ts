import type { Registry } from '@/domains/registries';

export class PorImageRegistryModel {
  UseRegistry = true;

  Registry: Partial<Registry> = {};

  Image = '';
}
