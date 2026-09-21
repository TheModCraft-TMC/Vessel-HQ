import { TaskViewModel } from '@/docker/models/task';
import { ContainerListViewModel } from '@/domains/containers/types';

export type DecoratedTask = TaskViewModel & {
  Container?: ContainerListViewModel;
};
