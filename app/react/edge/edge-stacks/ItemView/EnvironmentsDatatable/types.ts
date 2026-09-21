import { Environment } from '@/features/environments';

import { EdgeStackStatus } from '../../types';

export type EdgeStackEnvironment = Environment & {
  StackStatus: EdgeStackStatus;
  TargetFileVersion: string;
  GitConfigURL: string;
  TargetCommitHash: string;
};
