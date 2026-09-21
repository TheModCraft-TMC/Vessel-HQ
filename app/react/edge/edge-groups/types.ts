import {
  EnvironmentId,
  EnvironmentType,
} from '@/features/environments';
import { TagId } from '@/portainer/tags/types';

export interface EdgeGroup {
  Id: number;
  Name: string;
  Dynamic: boolean;
  TagIds: TagId[];
  Endpoints: EnvironmentId[];
  PartialMatch: boolean;
  EndpointTypes: EnvironmentType[];
}
