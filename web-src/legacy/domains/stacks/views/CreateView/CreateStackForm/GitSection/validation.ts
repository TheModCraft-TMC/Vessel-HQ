import { SchemaOf, object, boolean, string } from 'yup';

import { buildGitValidationSchema } from '@/domains/gitops';

import { GitFormValues } from './types';

export function getGitValidationSchema(): SchemaOf<GitFormValues> {
  return buildGitValidationSchema('compose').concat(
    object({
      SupportRelativePath: boolean().default(false),
      FilesystemPath: string()
        .default('')
        .when('SupportRelativePath', {
          is: true,
          then: string().required('Filesystem path is required'),
        }),
    })
  );
}
