import { useMemo } from 'react';
import _ from 'lodash';

import { ServiceViewModel } from '@/domains/services/models/service';
import { isoDate } from '@/portainer/filters/filters';
import { createOwnershipColumn } from '@/react/docker/components/datatable/createOwnershipColumn';
import { buildNameColumn } from '@/ui/components/data-table/buildNameColumn';
import { buildExpandColumn } from '@/ui/components/data-table/expand-column';

import { image } from './image';
import { columnHelper } from './helper';
import { schedulingMode } from './schedulingMode';
import { ports } from './ports';

export function useColumns(isStackColumnVisible?: boolean) {
  return useMemo(
    () =>
      _.compact([
        buildExpandColumn<ServiceViewModel>(),
        buildNameColumn<ServiceViewModel>(
          'Name',
          '/:endpointId/docker/services/:id',
          'docker-services-name'
        ),
        isStackColumnVisible &&
          columnHelper.accessor((item) => item.StackName || '-', {
            header: 'Stack',
            enableHiding: false,
          }),
        image,
        schedulingMode,
        ports,
        columnHelper.accessor('UpdatedAt', {
          header: 'Last Update',
          cell: ({ getValue }) => isoDate(getValue()),
        }),
        createOwnershipColumn<ServiceViewModel>(),
      ]),
    [isStackColumnVisible]
  );
}
