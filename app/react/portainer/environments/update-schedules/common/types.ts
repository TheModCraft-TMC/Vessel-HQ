import { EdgeGroup } from '@/domains/edge/models/edge-group';

import { ScheduleType } from '../types';

export interface FormValues {
  name: string;
  groupIds: EdgeGroup['Id'][];
  type: ScheduleType;
  version: string;
  scheduledTime: string;
}
