import _ from 'lodash';
import { useMemo } from 'react';

import { useIsSwarm } from '@/core/composition/useDockerInfo';
import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { createOwnershipColumn } from '@/domains/access-control';
import { isoDate, truncateLeftRight } from '@/shared/formatters';

import { DecoratedVolume } from '../../../models/types';

import { columnHelper } from './helper';
import { name } from './name';

export function useColumns() {
  const environmentId = useEnvironmentId();
  const isSwarm = useIsSwarm(environmentId);

  return useMemo(
    () =>
      _.compact([
        name,
        columnHelper.accessor((item) => item.StackName || '-', {
          header: 'Stack',
        }),
        columnHelper.accessor((item) => item.Driver, {
          header: 'Driver',
        }),
        columnHelper.accessor((item) => item.Mountpoint, {
          header: 'Mount point',
          cell({ getValue }) {
            return truncateLeftRight(getValue());
          },
        }),
        columnHelper.accessor((item) => item.CreatedAt, {
          header: 'Created',
          cell({ getValue }) {
            return isoDate(getValue());
          },
        }),
        isSwarm &&
          columnHelper.accessor((item) => item.NodeName || '-', {
            header: 'Host',
          }),
        createOwnershipColumn<DecoratedVolume>(),
      ]),
    [isSwarm]
  );
}
