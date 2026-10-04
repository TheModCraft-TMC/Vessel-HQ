import { Book } from 'lucide-react';

import { Datatable } from '@/ui/components/data-table';
import { useTableStateWithStorage } from '@/ui/components/data-table/useTableState';

import { Repository } from './types';
import { columns } from './columns';

export function RepositoriesDatatable({ dataset }: { dataset?: Repository[] }) {
  const tableState = useTableStateWithStorage('registryRepositories');
  return (
    <Datatable
      title="Repositories"
      titleIcon={Book}
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      settingsManager={tableState}
      disableSelect
      data-cy="registry-repositories-datatable"
    />
  );
}
