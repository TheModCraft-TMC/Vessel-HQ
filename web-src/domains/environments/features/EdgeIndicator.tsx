import { Activity } from 'lucide-react';

import { isoDateFromTimestamp } from '@/shared/formatters';
import { EnvironmentStatusBadgeItem } from '@/ui/components/status/EnvironmentStatusBadgeItem';

import { Environment } from '../types';

interface Props {
  showLastCheckInDate?: boolean;
  environment: Environment;
}

export function EdgeIndicator({
  environment,
  showLastCheckInDate = false,
}: Props) {
  const associated = !!environment.EdgeID;
  if (!associated) {
    return (
      <span role="status" aria-label="edge-status">
        <EnvironmentStatusBadgeItem aria-label="unassociated">
          <span className="whitespace-nowrap">Not associated</span>
        </EnvironmentStatusBadgeItem>
      </span>
    );
  }

  return (
    <span
      role="status"
      aria-label="edge-status"
      className="flex items-center gap-1"
    >
      {showLastCheckInDate && !!environment.LastCheckInDate && (
        <span
          className="small text-muted vertical-center"
          aria-label="edge-last-checkin"
          title="Last edge check-in"
        >
          <Activity className="icon icon-sm space-right" aria-hidden="true" />
          {isoDateFromTimestamp(environment.LastCheckInDate)}
        </span>
      )}
    </span>
  );
}
