import { EdgeAsyncIntervalsValues } from '@/domains/edge/components/EdgeAsyncIntervalsForm';
import { EnvironmentMetadata } from '@/domains/environments';

export interface FormValues {
  name: string;

  portainerUrl: string;
  tunnelServerAddr?: string;
  pollFrequency: number;
  meta: EnvironmentMetadata;

  edge: EdgeAsyncIntervalsValues;
}
