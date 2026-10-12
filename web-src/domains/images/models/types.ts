import { DockerImageResponse } from '../models/response';

type DecoratedDockerImage = {
  Used: boolean;
};

export type DockerImage = DecoratedDockerImage &
  Omit<DockerImageResponse, keyof DecoratedDockerImage>;
