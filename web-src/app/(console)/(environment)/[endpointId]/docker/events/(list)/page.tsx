'use client';

import { useState } from 'react';
import moment from 'moment';

import { useEvents } from '@/react/docker/proxy/queries/useEvents';
import { EventsDatatable } from '@/react/docker/events/EventsDatatables';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  const environmentId = useEnvironmentId();
  const [{ since, until }] = useState(() => ({
    since: moment().subtract(24, 'hour').unix(),
    until: moment().unix(),
  }));
  const eventsQuery = useEvents(environmentId, { params: { since, until } });

  return (
    <>
      <PageHeader title="Event list" breadcrumbs="Events" reload />
      <EventsDatatable dataset={eventsQuery.data} />
    </>
  );
}
