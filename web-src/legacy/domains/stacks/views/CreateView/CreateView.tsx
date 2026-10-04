import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsSwarmManager } from '@/domains/stacks/hooks/useDockerEnvironment';
import { useSwarmId } from '@/domains/stacks/hooks/useDockerEnvironment';
import { PageHeader } from '@/ui/layouts/view-layout';

import { Widget } from '@@/Widget';

import { CreateStackForm } from './CreateStackForm/CreateStackForm';

export function CreateView() {
  return (
    <>
      <PageHeader title="Create stack" breadcrumbs="Stack creation" reload />
      <CreateStackContent />
    </>
  );
}

export function CreateStackContent() {
  const environmentId = useEnvironmentId();

  // Only swarm managers deploy swarm stacks; workers deploy compose stacks.
  const isSwarm = useIsSwarmManager(environmentId);
  const swarmIdQuery = useSwarmId(environmentId);

  if (isSwarm && swarmIdQuery.isLoading) {
    return null;
  }

  const swarmId = isSwarm && swarmIdQuery.data ? swarmIdQuery.data : '';

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <Widget.Body>
            <CreateStackForm
              environmentId={environmentId}
              isSwarm={isSwarm}
              swarmId={swarmId}
            />
          </Widget.Body>
        </Widget>
      </div>
    </div>
  );
}
