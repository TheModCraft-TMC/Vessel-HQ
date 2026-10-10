import { Wrench } from 'lucide-react';

import {
  EnvironmentId,
  EnvironmentType,
  EnvironmentStatus,
} from '@/domains/environments';
import {
  isKubernetesEnvironment,
  isEdgeEnvironment,
} from '@/domains/environments/utils';
import { InformationPanel } from '@/react/components/InformationPanel';
import { Link } from '@/ui/components/links/Link';
import { Icon } from '@/ui/components/icons/Icon';

interface Props {
  environmentId?: EnvironmentId;
  environmentType?: EnvironmentType;
  edgeId?: string;
  status: EnvironmentStatus;
}

export function KubeConfigInfo({
  environmentId,
  environmentType,
  edgeId,
  status,
}: Props) {
  if (!environmentType) {
    return null;
  }

  const isVisible =
    isKubernetesEnvironment(environmentType) &&
    (!isEdgeEnvironment(environmentType) || !!edgeId) &&
    status !== EnvironmentStatus.Down;

  if (!isVisible) {
    return null;
  }

  return (
    <InformationPanel title="Kubernetes features configuration">
      <span className="small text-muted vertical-center">
        <Icon icon={Wrench} mode="primary" />
        <div>
          You should configure the features available in this Kubernetes
          environment in the{' '}
          <Link
            to="/:endpointId/kubernetes/cluster/configure"
            params={{ endpointId: environmentId }}
            data-cy="kubernetes-config-link"
          >
            Kubernetes configuration
          </Link>{' '}
          view.
        </div>
      </span>
    </InformationPanel>
  );
}
