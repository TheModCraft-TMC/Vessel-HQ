import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsSwarmManager } from '@/react/docker/proxy/queries/useInfo';
import { StackType } from '@/domains/stacks';
import { ContainerEngine } from '@/domains/environments';
import { PageHeader } from '@/ui/layouts/view-layout';

import { Widget } from '@@/Widget';

import { TemplateViewType, useViewType } from '../useViewType';

import { CreateForm } from './CreateForm';

export function CreateView() {
  const viewType = useViewType();
  const environmentId = useEnvironmentId(false);
  // A worker defaults to a compose template; only a manager defaults to swarm.
  const isSwarmManager = useIsSwarmManager(environmentId, {
    enabled: viewType === ContainerEngine.Docker,
  });
  const defaultType = getDefaultType(viewType, isSwarmManager);

  return (
    <div>
      <PageHeader
        title="Create Custom Template"
        breadcrumbs={[
          { label: 'Custom Templates', link: '^' },
          'Create Custom Template',
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <CreateForm
                viewType={viewType}
                environmentId={environmentId}
                defaultType={defaultType}
              />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </div>
  );
}

function getDefaultType(
  viewType: TemplateViewType,
  isSwarm: boolean
): StackType {
  switch (viewType) {
    case 'docker':
      return isSwarm ? StackType.DockerSwarm : StackType.DockerCompose;
    case 'kube':
      return StackType.Kubernetes;
    default:
      return StackType.DockerCompose;
  }
}
