import { GitFormModel } from '@/domains/gitops';

export interface GitFormValues extends GitFormModel {
  SupportRelativePath: boolean;
  FilesystemPath: string;
}
