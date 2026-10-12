import { TrelloIcon } from 'lucide-react';
import { Link } from '@console/navigation/Link';

import { Button } from '@/ui/components/buttons';

export function ClusterVisualizerLink() {
  return (
    <tr>
      <td colSpan={2}>
        <Button
          as={Link}
          color="link"
          icon={TrelloIcon}
          props={{
            to: '/:endpointId/docker/swarm/visualizer',
          }}
          data-cy="cluster-visualizer"
        >
          Go to cluster visualizer
        </Button>
      </td>
    </tr>
  );
}
