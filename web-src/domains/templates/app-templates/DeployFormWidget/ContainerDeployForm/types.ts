import { AccessControlFormData } from '@/domains/access-control';
import type {
  PortMapping,
  VolumesTabValues,
  LabelsTabValues,
} from '@/domains/containers';

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
