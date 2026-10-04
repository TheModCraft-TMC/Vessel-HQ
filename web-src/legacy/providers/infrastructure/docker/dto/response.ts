export type DockerPortainerResponse<T, TResourceControl = Record<string, unknown>> = T & {
  Portainer?: {
    ResourceControl?: TResourceControl;
    Agent?: { NodeName: string };
  };
  IsPortainer?: boolean;
};
