import { EnvironmentId, EnvironmentType } from '@/domains/environments';
import { TagId } from '@/domains/tags';

export interface EdgeGroup {
  Id: number;
  Name: string;
  Dynamic: boolean;
  TagIds: TagId[];
  Endpoints: EnvironmentId[];
  PartialMatch: boolean;
  EndpointTypes: EnvironmentType[];
}
