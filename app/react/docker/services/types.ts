import { ServiceSpec, TaskSpec } from 'docker-types';

export type ServiceId = string;

export type Filters = {
  id?: ServiceId[];
  label?: string[];
  mode?: ['replicated' | 'global'];
  name?: string[];
};

export type ServiceUpdateConfig = ServiceSpec & {
  Name: string;
  Labels: Record<string, string>;
  TaskTemplate: TaskSpec;
  Mode: ServiceSpec['Mode'];
  UpdateConfig: ServiceSpec['UpdateConfig'];
  Networks: ServiceSpec['Networks'];
  EndpointSpec: ServiceSpec['EndpointSpec'];
};
