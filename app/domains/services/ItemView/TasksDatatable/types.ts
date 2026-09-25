import { TaskViewModel } from '@/domains/services/models/task';
import { ContainerListViewModel } from '@/domains/containers';

export type DecoratedTask = TaskViewModel & {
  Container?: ContainerListViewModel;
};
