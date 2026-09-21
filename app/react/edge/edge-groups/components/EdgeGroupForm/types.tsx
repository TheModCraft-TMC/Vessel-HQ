import {
  EdgeGroupId,
  EnvironmentId,
} from '@/features/environments';
import { TagId } from '@/portainer/tags/types';

export interface FormValues {
  edgeGroupId: EdgeGroupId;
  name: string;
  dynamic: boolean;
  environmentIds: EnvironmentId[];
  partialMatch: boolean;
  tagIds: TagId[];
}
