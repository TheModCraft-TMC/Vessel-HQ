import { User, UserPlus } from 'lucide-react';

import { isEdgeAdmin } from '@/domains/users';
import { RoleNames } from '@/domains/users';
import { Icon } from '@/ui/components/icons/Icon';

import { helper } from './helper';

export const role = helper.accessor(
  (item) =>
    `${RoleNames[item.Role]} ${
      item.isTeamLeader ? ' - team leader' : ''
    }`.trim(),
  {
    header: 'Role',
    cell: ({ getValue, row: { original: item } }) => {
      const icon =
        isEdgeAdmin({ Role: item.Role }) || item.isTeamLeader ? User : UserPlus;

      return (
        <span className="vertical-center">
          <Icon icon={icon} />
          {getValue() || '-'}
        </span>
      );
    },
  }
);
