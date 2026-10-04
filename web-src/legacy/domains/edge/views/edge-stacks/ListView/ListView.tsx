import { useQueryClient } from '@tanstack/react-query';

import { PageHeader } from '@/ui/layouts/view-layout';
import { queryKeys } from '@/domains/edge/queries/edge-stacks/query-keys';

import { EdgeStacksDatatable } from './EdgeStacksDatatable';

export function ListView() {
  const queryClient = useQueryClient();

  return (
    <>
      <PageHeader
        title="Edge Stacks list"
        breadcrumbs="Edge Stacks"
        reload
        onReload={() => queryClient.invalidateQueries(queryKeys.base())}
      />

      <EdgeStacksDatatable />
    </>
  );
}
