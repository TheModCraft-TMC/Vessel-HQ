import { Link } from '@console/navigation/Link';

import { EnvironmentStatus } from '@/domains/environments';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  cell: ({ getValue, row: { original: environment } }) => {
    const name = getValue();
    if (environment.Status === EnvironmentStatus.Provisioning) {
      return name;
    }

    return (
      <Link
        to="/environments/:id"
        params={{ id: environment.Id }}
        data-cy={`environment-link-${environment.Id}`}
      >
        {name}
      </Link>
    );
  },
});
