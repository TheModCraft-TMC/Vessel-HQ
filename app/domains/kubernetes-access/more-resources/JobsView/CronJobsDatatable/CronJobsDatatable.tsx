import { useMemo } from 'react';
import { Trash2, CalendarSync } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import {
  notifyError,
  notifySuccess,
} from '@/ui/components/toast/notifications';
import {
  CreateFromManifestButton,
  DefaultDatatableSettings,
  SystemResourceDescription,
  useKubeStore,
} from '@/domains/clusters';
import type { KubeTableSettings } from '@/domains/clusters';
import { confirmDelete } from '@/ui/components/dialog/confirm';
import { TableSettingsMenu } from '@/ui/components/data-table';
import { CardExpandableList } from '@/ui/components/data-table/CardExpandableList';
import { LoadingButton } from '@/ui/components/buttons';
import {
  type FilteredColumnsTableSettings,
  filteredColumnsSettings,
} from '@/ui/components/data-table/types';
import { mergeOptions } from '@/ui/components/data-table/extend-options/mergeOptions';
import { withColumnFilters } from '@/ui/components/data-table/extend-options/withColumnFilters';

import { Job } from '../JobsDatatable/types';

import { useCronJobs } from './queries/useCronJobs';
import { columns } from './columns';
import { CronJob } from './types';
import { useDeleteCronJobsMutation } from './queries/useDeleteCronJobsMutation';
import { CronJobsExecutionsInnerDatatable } from './CronJobsExecutionsInnerDatatable';

const storageKey = 'cronJobs';

interface TableSettings
  extends KubeTableSettings, FilteredColumnsTableSettings {}

interface CronJobsExecutionsProps {
  item: Job[];
}

export function CronJobsDatatable() {
  const environmentId = useEnvironmentId();
  const tableState = useKubeStore<TableSettings>(
    storageKey,
    undefined,
    (set) => ({
      ...filteredColumnsSettings(set),
    })
  );

  const cronJobsQuery = useCronJobs(environmentId, {});
  const cronJobsRowData = cronJobsQuery.data;

  const { authorized: canAccessSystemResources } = useAuthorizations(
    'K8sAccessSystemNamespaces'
  );
  const filteredCronJobs = useMemo(
    () =>
      tableState.showSystemResources
        ? cronJobsRowData
        : cronJobsRowData?.filter(
            (cronJob) =>
              (canAccessSystemResources && tableState.showSystemResources) ||
              !cronJob.IsSystem
          ),
    [cronJobsRowData, tableState.showSystemResources, canAccessSystemResources]
  );

  return (
    <CardExpandableList
      dataset={filteredCronJobs || []}
      columns={columns}
      settingsManager={tableState}
      isLoading={cronJobsQuery.isLoading}
      title="Cron Jobs"
      titleIcon={CalendarSync}
      getRowId={(row) => row.Id}
      isRowSelectable={(row) => !row.original.IsSystem}
      renderTableActions={(selectedRows) => (
        <TableActions selectedItems={selectedRows} />
      )}
      renderTableSettings={() => (
        <TableSettingsMenu>
          <DefaultDatatableSettings settings={tableState} />
        </TableSettingsMenu>
      )}
      description={
        <SystemResourceDescription
          showSystemResources={tableState.showSystemResources}
        />
      }
      data-cy="k8s-cronJobs-datatable"
      extendTableOptions={mergeOptions(
        withColumnFilters(tableState.columnFilters, tableState.setColumnFilters)
      )}
      getRowCanExpand={(row) => (row.original.Jobs ?? []).length > 0}
      renderSubRow={(row) => <SubRow item={row.original.Jobs ?? []} />}
    />
  );
}

function SubRow({ item }: CronJobsExecutionsProps) {
  return <CronJobsExecutionsInnerDatatable item={item} />;
}

interface SelectedCronJob {
  Namespace: string;
  Name: string;
}

type TableActionsProps = {
  selectedItems: CronJob[];
};

function TableActions({ selectedItems }: TableActionsProps) {
  const environmentId = useEnvironmentId();
  const deleteCronJobsMutation = useDeleteCronJobsMutation(environmentId);
  const router = useRouter();

  return (
    <Authorized authorizations="K8sCronJobsW">
      <LoadingButton
        className="btn-wrapper"
        color="dangerlight"
        disabled={selectedItems.length === 0}
        onClick={() => handleRemoveClick(selectedItems)}
        icon={Trash2}
        isLoading={deleteCronJobsMutation.isLoading}
        loadingText="Removing Cron Jobs..."
        data-cy="k8s-cronJobs-removeCronJobButton"
      >
        Remove
      </LoadingButton>

      <CreateFromManifestButton
        params={{ tab: 'cronJobs' }}
        data-cy="k8s-cronJobs-deploy-button"
      />
    </Authorized>
  );

  async function handleRemoveClick(cronJobs: SelectedCronJob[]) {
    const confirmed = await confirmDelete(
      <>
        <p>Are you sure you want to delete the selected Cron Jobs?</p>
        <ul className="mt-2 max-h-96 list-inside overflow-hidden overflow-y-auto text-sm">
          {cronJobs.map((s, index) => (
            <li key={index}>
              {s.Namespace}/{s.Name}
            </li>
          ))}
        </ul>
      </>
    );
    if (!confirmed) {
      return null;
    }

    const payload: Record<string, string[]> = {};
    cronJobs.forEach((r) => {
      payload[r.Namespace] = payload[r.Namespace] || [];
      payload[r.Namespace].push(r.Name);
    });

    deleteCronJobsMutation.mutate(
      { environmentId, data: payload },
      {
        onSuccess: () => {
          notifySuccess(
            'Cron Jobs successfully removed',
            cronJobs.map((r) => `${r.Namespace}/${r.Name}`).join(', ')
          );
          router.stateService.reload();
        },
        onError: (error) => {
          notifyError(
            'Unable to delete Cron Jobs',
            error as Error,
            cronJobs.map((r) => `${r.Namespace}/${r.Name}`).join(', ')
          );
        },
      }
    );

    return cronJobs;
  }
}
