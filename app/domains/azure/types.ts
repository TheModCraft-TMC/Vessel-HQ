import { AccessControlFormData } from '@/react/portainer/access-control/types';

import { PortMapping } from './components/ContainerInstances/PortsMappingField/PortsMappingField';
import type { AzureContainerOperatingSystem } from './models';

export type {
  AzureContainerOperatingSystem,
  ContainerGroup,
  ProviderViewModel,
  ResourceGroup,
  Subscription,
} from './models';

export interface ContainerInstanceFormValues {
  name: string;
  location?: string;
  subscription?: string;
  resourceGroup?: string;
  image: string;
  os: AzureContainerOperatingSystem;
  memory: number;
  cpu: number;
  ports: PortMapping[];
  allocatePublicIP: boolean;
  accessControl: AccessControlFormData;
  env: { name: string; value: string }[];
}
