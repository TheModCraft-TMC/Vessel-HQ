import { DockerPortainerResponse } from '@/providers/infrastructure/docker';

export type DockerImageResponse = DockerPortainerResponse<{
  Containers: number;
  Created: number;
  Id: string;
  Labels: { [key: string]: string };
  ParentId: string;
  RepoDigests: string[];
  RepoTags: string[];
  SharedSize: number;
  Size: number;
}>;
