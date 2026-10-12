import { TagId } from '@/domains/tags';
import { EdgeGroup } from '@/domains/edge/models/edge-group';
import { EnvironmentGroupId } from '@/domains/environments';

export interface FormValues {
  group: EnvironmentGroupId | null;
  overrideGroup: boolean;
  edgeGroups: Array<EdgeGroup['Id']>;
  overrideEdgeGroups: boolean;
  tags: Array<TagId>;
  overrideTags: boolean;
}
