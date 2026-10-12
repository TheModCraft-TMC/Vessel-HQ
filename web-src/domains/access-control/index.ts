export * from './types';
export {
  determineOwnership,
  ResourceControlViewModel,
} from './ResourceControlViewModel';
export {
  defaultValues,
  parseAccessControlFormData,
  parseOwnershipParameters,
} from './utils';
export * from './access-control.service';
export {
  createOwnershipColumn,
  ownershipIcon,
} from './features/createOwnershipColumn';
export type { IResource } from './features/createOwnershipColumn';
