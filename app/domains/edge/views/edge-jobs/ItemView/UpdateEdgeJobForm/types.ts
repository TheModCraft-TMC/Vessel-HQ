import { EdgeGroup } from '@/domains/edge/models/edge-group';
import { EnvironmentId } from '@/domains/environments';

import { timeOptions } from '../../components/EdgeJobForm/RecurringFieldset';

export interface FormValues {
  name: string;
  recurring: boolean;
  edgeGroupIds: Array<EdgeGroup['Id']>;
  environmentIds: Array<EnvironmentId>;

  fileContent: string;

  cronMethod: 'basic' | 'advanced';
  dateTime: Date; // basic !recurring
  recurringOption: (typeof timeOptions)[number]['value']; // basic recurring
  cronExpression: string; // advanced
}
