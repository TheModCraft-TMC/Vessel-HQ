import { object, SchemaOf, string } from 'yup';

import { tlsConfigValidation } from '@/core/components/TLSFieldset/TLSFieldset';
import { useNameValidation } from '@/domains/environments/features/NameField/NameField';
import { metadataValidation } from '@/domains/environments/features/MetadataFieldset/validation';

import { FormValues } from './types';

export function useValidation(): SchemaOf<FormValues> {
  return object({
    name: useNameValidation(),
    url: string().required('This field is required.'),
    tlsConfig: tlsConfigValidation(),
    meta: metadataValidation(),
  });
}
