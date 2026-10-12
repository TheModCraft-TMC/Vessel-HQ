import { boolean, object, SchemaOf, string } from 'yup';

import { useNameValidation } from '@/domains/environments/features/NameField/NameField';
import { metadataValidation } from '@/domains/environments/features/MetadataFieldset/validation';

import { FormValues } from './types';

export function useValidation(): SchemaOf<FormValues> {
  return object({
    name: useNameValidation(),
    meta: metadataValidation(),
    overridePath: boolean().default(false),
    socketPath: string()
      .default('')
      .when('overridePath', (overridePath, schema) =>
        overridePath
          ? schema.required(
              'Socket Path is required when override path is enabled'
            )
          : schema
      ),
  });
}
