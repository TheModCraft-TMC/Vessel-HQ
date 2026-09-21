import { TaskViewModel } from '@/docker/models/task';
import { ContainerListViewModel } from '@/features/containers/types';

export type DecoratedTask = TaskViewModel & {
  Container?: ContainerListViewModel;
};
