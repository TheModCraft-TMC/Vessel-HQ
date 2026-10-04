import { useRouteParams } from '@console/console/routing/useRouteParams';
import { Search } from 'lucide-react';

import { Environment } from '@/domains/environments';
import { Button } from '@/ui/components/buttons';
import { Link } from '@/ui/components/links/Link';
import { Icon } from '@/ui/components/icons/Icon';

import { LogsActions } from './LogsActions';

interface Props {
  environment: Environment;
}

export function EnvironmentActions({ environment }: Props) {
  const { stackId } = useRouteParams();
  const edgeStackId = Number(stackId);

  return (
    <div>
      {environment.Snapshots.length > 0 && environment.Edge.AsyncMode && (
        <Link
          to="/:environmentId/docker/containers"
          params={{ environmentId: environment.Id, edgeStackId }}
          className="hover:!no-underline"
          data-cy="browse-snapshot-link"
        >
          <Button
            color="none"
            title="Browse Snapshot"
            data-cy="browse-snapshot-button"
          >
            <Icon icon={Search} className="searchIcon" />
          </Button>
        </Link>
      )}
      {environment.Edge.AsyncMode && (
        <LogsActions environmentId={environment.Id} edgeStackId={edgeStackId} />
      )}
    </div>
  );
}
