import { StackType } from '@/domains/stacks';
import { type Values as CommonFieldsValues } from '@/domains/templates';
import { DefinitionFieldValues } from '@/domains/templates';
import { Platform } from '@/domains/templates';
import { GitFormModel } from '@/domains/gitops';
import { AccessControlFormData } from '@/react/portainer/access-control/types';

import { EdgeTemplateSettings } from '../types';

export interface FormValues extends CommonFieldsValues {
  Platform: Platform;
  Type: StackType;
  FileContent: string;
  Git?: GitFormModel;
  Variables: DefinitionFieldValues;
  AccessControl?: AccessControlFormData;
  EdgeSettings?: EdgeTemplateSettings;
}
