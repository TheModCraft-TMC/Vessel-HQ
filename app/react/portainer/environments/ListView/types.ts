import { Environment } from '@/domains/environments';

export type EnvironmentListItem = {
  GroupName?: string;
} & Environment;
