import UpdatesAvailable from '@/assets/ico/icon_updates-available.svg?c';
import UpToDate from '@/assets/ico/icon_up-to-date.svg?c';
import UpdatesUnknown from '@/assets/ico/icon_updates-unknown.svg?c';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Icon } from '@/ui/components/icons/Icon';
import { Tooltip } from '@/ui/components/feedback/Tip/Tooltip';
import {
  TableColumnHeaderWithDescription,
  TableColumnHeaderWithDescriptionProps,
} from '@/ui/components/data-table/TableHeaderCell';

export function TableColumnHeaderImageUpToDate({
  canSort,
  isSorted,
  colTitle,
  isSortedDesc = true,
}: TableColumnHeaderWithDescriptionProps) {
  return (
    <TableColumnHeaderWithDescription
      canSort={canSort}
      isSorted={isSorted}
      colTitle={colTitle}
      isSortedDesc={isSortedDesc}
    >
      <ImageUpToDateTooltip />
    </TableColumnHeaderWithDescription>
  );
}

export function ImageUpToDateTooltip() {
  const environmentId = useEnvironmentId();

  const enableImageNotificationQuery = useEnvironment(
    environmentId,
    (environment) => environment?.EnableImageNotification
  );

  if (!enableImageNotificationQuery.data) {
    return null;
  }

  if (!isBE) {
    return null;
  }

  return (
    <Tooltip
      position="top"
      message={
        <div className="flex flex-col gap-y-2 p-2">
          <div className="flex items-center gap-2">
            <Icon icon={UpToDate} />
            Images are up to date
          </div>
          <div className="flex items-center gap-2">
            <Icon icon={UpdatesAvailable} />
            Updates are available
          </div>
          <div className="flex items-center gap-2">
            <Icon icon={UpdatesUnknown} />
            Updates availability unknown
          </div>
        </div>
      }
    />
  );
}
