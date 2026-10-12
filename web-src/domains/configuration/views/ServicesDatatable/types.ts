import type { Service } from '../../services/types';

export type ServiceRowData = Service & {
  IsSystem: boolean;
};
