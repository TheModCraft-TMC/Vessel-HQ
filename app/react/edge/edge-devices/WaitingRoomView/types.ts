import { Environment } from '@/domains/environments';

export type WaitingRoomEnvironment = Environment & {
  EdgeGroups: string[];
  Tags: string[];
  Group: string;
};
