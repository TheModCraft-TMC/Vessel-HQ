import { ResourceControlViewModel } from '@/domains/access-control';

export type DockerConfig = {
  Id: string;
  Name: string;
  CreatedAt: string;
  ResourceControl?: ResourceControlViewModel;
};
