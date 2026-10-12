import { StackType } from '@/domains/stacks';
import { type Values as CommonFieldsValues } from '@/domains/templates';
import { DefinitionFieldValues } from '@/domains/templates';
import { Platform } from '@/domains/templates';
import { GitFormModel } from '@/domains/gitops';
import { AccessControlFormData } from '@/domains/access-control';
import {
  editor,
  upload,
  git,
} from '@/core/components/BoxSelector/common-options/build-methods';

import { EdgeTemplateSettings } from '../types';

export const initialBuildMethods = [editor, upload, git] as const;

export type Method = (typeof initialBuildMethods)[number]['value'];

export interface FormValues extends CommonFieldsValues {
  Platform: Platform;
  Type: StackType;
  Method: Method;
  FileContent: string;
  File: File | undefined;
  Git: GitFormModel;
  Variables: DefinitionFieldValues;
  AccessControl?: AccessControlFormData;
  EdgeSettings?: EdgeTemplateSettings;
}
