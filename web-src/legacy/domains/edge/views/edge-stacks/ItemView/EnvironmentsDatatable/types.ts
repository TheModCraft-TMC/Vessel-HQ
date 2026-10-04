import { Environment } from '@/domains/environments';
import { EdgeStackStatus } from '@/domains/edge/models/edge-stack';

export type EdgeStackEnvironment = Environment & {
  StackStatus: EdgeStackStatus;
  TargetFileVersion: string;
  GitConfigURL: string;
  TargetCommitHash: string;
};
