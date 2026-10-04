import { AccessControlFormData } from '@/react/portainer/access-control/types';
import { VariablesFieldValue } from '@/domains/templates';

export interface FormValues {
  name: string;
  variables: VariablesFieldValue;
  accessControl: AccessControlFormData;
  fileContent: string;
}
