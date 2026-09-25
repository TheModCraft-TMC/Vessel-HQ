import { EnvironmentId } from '@/domains/environments';
import { UserId } from '@/domains/users';
import { EdgeGroup } from '@/domains/edge/models/edge-group';

export enum ScheduleType {
  Update = 1,
  Rollback,
}

export enum StatusType {
  Pending,
  Failed,
  Success,
  Sent,
}

export type EdgeUpdateSchedule = {
  id: number;
  name: string;

  type: ScheduleType;

  created: number;
  createdBy: UserId;
  version: string;
  environmentsPreviousVersions: Record<EnvironmentId, string>;
};

export type EdgeUpdateResponse = EdgeUpdateSchedule & {
  // from edge stack:
  edgeGroupIds: EdgeGroup['Id'][];
  scheduledTime: string;
};
