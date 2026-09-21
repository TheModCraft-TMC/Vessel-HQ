import { Environment } from '@/features/environments';

export type WaitingRoomEnvironment = Environment & {
  EdgeGroups: string[];
  Tags: string[];
  Group: string;
};
