import { Task } from '@/providers/infrastructure/docker';

export type TaskId = NonNullable<Task['ID']>;

export type TaskLogsParams = {
  stdout?: boolean;
  stderr?: boolean;
  timestamps?: boolean;
  since?: number;
  tail?: number;
};
