import { SchemaOf, object, mixed, string } from 'yup';

import { validateYAML } from '@/domains/stacks/components/common/stackYamlValidation';

import { UploadFormValues } from './types';

export function getUploadValidationSchema({
  containerNames = [],
}: {
  containerNames: Array<string> | undefined;
}): SchemaOf<UploadFormValues> {
  return object({
    file: mixed<File>()
      .required('Stack file is required')
      .test(
        'valid-yaml',
        'Invalid YAML',
        async function validateYamlTest(value) {
          if (!value || value.name.toLowerCase().endsWith('.zip')) {
            return true;
          }

          let fileContent: string;
          try {
            fileContent = await value.text();
          } catch {
            return this.createError({ message: 'Unable to read file' });
          }

          const yamlError = validateYAML(fileContent, containerNames, []);

          if (yamlError) {
            return this.createError({ message: yamlError });
          }

          return true;
        }
      ),
    projectDigest: string()
      .optional()
      .test(
        'reviewed-project',
        'Review the project archive and confirm its external requirements',
        function reviewedProject(value) {
          const file = (this.parent as UploadFormValues).file;
          return !file?.name.toLowerCase().endsWith('.zip') || !!value;
        }
      ),
  });
}
