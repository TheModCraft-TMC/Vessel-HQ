import { EdgeGroupId, EnvironmentId } from '@/domains/environments';
import { TagId } from '@/domains/tags';

export interface FormValues {
  edgeGroupId: EdgeGroupId;
  name: string;
  dynamic: boolean;
  environmentIds: EnvironmentId[];
  partialMatch: boolean;
  tagIds: TagId[];
}
