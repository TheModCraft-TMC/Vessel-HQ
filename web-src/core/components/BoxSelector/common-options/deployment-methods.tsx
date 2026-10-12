import Kubernetes from '@/shared/assets/ico/vendor/kubernetes.svg?c';
import DockerCompose from '@/shared/assets/ico/vendor/docker-compose.svg?c';
import type { BoxSelectorOption } from '@/ui/components/BoxSelector';

export const kubernetes: BoxSelectorOption<'kubernetes'> = {
  id: 'method_kubernetes',
  icon: Kubernetes,
  label: 'Kubernetes',
  description: 'Kubernetes manifest format',
  value: 'kubernetes',
  iconType: 'logo',
};

export const compose: BoxSelectorOption<'compose'> = {
  id: 'method_compose',
  icon: DockerCompose,
  label: 'Compose',
  description: 'docker-compose format',
  value: 'compose',
  iconType: 'logo',
};
