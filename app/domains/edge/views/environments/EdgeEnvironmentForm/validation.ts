import { object, string, SchemaOf } from 'yup';

import { EnvironmentId } from '@/domains/environments';
import { useNameValidation } from '@/react/portainer/environments/common/NameField/NameField';
import { edgeIntervalsValidation } from '@/domains/edge/components/EdgeIntervalsFieldset/validation';
import { metadataValidation } from '@/react/portainer/environments/common/MetadataFieldset/validation';

import { EdgeEnvironmentFormValues } from './types';

/**
 * Create validation schema for Edge environment form.
 * Accepts the original environment name to allow keeping the same name.
 */
export function useEdgeValidation(
  envId: EnvironmentId
): SchemaOf<EdgeEnvironmentFormValues> {
  return object({
    name: useNameValidation(envId),
    publicUrl: string().default(''),
    edge: edgeIntervalsValidation(),
    meta: metadataValidation(),
  });
}
