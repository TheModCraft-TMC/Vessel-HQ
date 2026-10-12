import { AccessControlFormData } from '@/domains/access-control';
import { VariablesFieldValue } from '@/domains/templates';

export interface FormValues {
  name: string;
  variables: VariablesFieldValue;
  accessControl: AccessControlFormData;
  fileContent: string;
}
