import { AccessControlFormData } from '@/react/portainer/access-control/types';
import { PortMapping } from '@/features/containers/CreateView/BaseForm/PortsMappingField';
import { VolumesTabValues } from '@/features/containers/CreateView/VolumesTab';
import { LabelsTabValues } from '@/features/containers/CreateView/LabelsTab';

import { EnvVarsValue } from '../EnvVarsFieldset';

export interface FormValues {
  name: string;
  network: string;
  accessControl: AccessControlFormData;
  ports: Array<PortMapping>;
  volumes: VolumesTabValues;
  hosts: Array<string>;
  labels: LabelsTabValues;
  hostname: string;
  envVars: EnvVarsValue;
}
