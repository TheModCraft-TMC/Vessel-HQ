import { EdgeIntervalsValues } from '@/domains/edge/components/EdgeIntervalsFieldset/types';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface EdgeEnvironmentFormValues {
  /** Environment name */
  name: string;

  /** Public URL for the environment */
  publicUrl: string;

  /** Edge check-in interval settings */
  edge: EdgeIntervalsValues;

  /** Metadata (required by MetadataFieldset) */
  meta: EnvironmentMetadata;
}
