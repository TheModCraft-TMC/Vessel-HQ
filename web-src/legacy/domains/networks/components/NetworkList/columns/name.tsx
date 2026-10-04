import { truncate } from '@/portainer/filters/filters';
import { Link } from '@/ui/components/links/Link';
import { Badge } from '@/ui/components/status/Badge';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  id: 'name',
  cell({ row: { original: item } }) {
    return (
      <>
        <Link
          to="./:id"
          params={{ id: item.Id, nodeName: item.NodeName }}
          title={item.Name}
          data-cy={`network-link-${item.Name}`}
        >
          {truncate(item.Name, 40)}
        </Link>
        {item.ResourceControl?.System && (
          <Badge type="info" className="ml-2">
            System
          </Badge>
        )}
      </>
    );
  },
});
