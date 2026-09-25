import { EdgeAsyncIntervalsValues } from '@/domains/edge/components/EdgeAsyncIntervalsForm';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;

  portainerUrl: string;
  tunnelServerAddr?: string;
  pollFrequency: number;
  meta: EnvironmentMetadata;

  edge: EdgeAsyncIntervalsValues;
}
