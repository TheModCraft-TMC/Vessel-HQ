import { RegistryTypes, type Registry } from '@/domains/registries';

export class DockerHubViewModel implements Pick<
  Registry,
  'Id' | 'Type' | 'Name' | 'URL'
> {
  Id = 0;

  Type = RegistryTypes.ANONYMOUS;

  Name = 'Docker Hub (anonymous)';

  URL = 'docker.io';
}
