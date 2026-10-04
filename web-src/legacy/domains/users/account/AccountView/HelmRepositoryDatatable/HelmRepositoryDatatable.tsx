import { useMemo, useEffect } from 'react';

import { useCurrentUser } from '@/react/hooks/useUser';
import helm from '@/assets/ico/vendor/helm.svg?c';
import { isPureAdmin } from '@/domains/users';
import { Link } from '@/ui/components/links/Link';
import { Datatable } from '@/ui/components/data-table';
import { createPersistedStore } from '@/ui/components/data-table/types';
import { useTableState } from '@/ui/components/data-table/useTableState';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { columns } from './columns';
import { HelmRepositoryDatatableActions } from './HelmRepositoryDatatableActions';
import { useHelmRepositories } from './helm-repositories.service';
import { HelmRepository } from './types';

const storageKey = 'helmRepository';

const settingsStore = createPersistedStore(storageKey);

export function HelmRepositoryDatatable() {
  const { user } = useCurrentUser();
  const helmReposQuery = useHelmRepositories(user.Id);

  const isAdminUser = isPureAdmin(user);

  const tableState = useTableState(settingsStore, storageKey);

  const helmRepos = useMemo(() => {
    const helmRepos = [];
    if (helmReposQuery.data?.GlobalRepository) {
      const helmrepository: HelmRepository = {
        Global: true,
        URL: helmReposQuery.data.GlobalRepository,
        Id: 0,
        UserId: 0,
      };
      helmRepos.push(helmrepository);
    }
    return [...helmRepos, ...(helmReposQuery.data?.UserRepositories ?? [])];
  }, [
    helmReposQuery.data?.GlobalRepository,
    helmReposQuery.data?.UserRepositories,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const section = window.location.hash.slice(1);
      if (section) {
        document.getElementById(section)?.scrollIntoView();
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Datatable
      id="helm-repositories"
      getRowId={(row) => String(row.Id)}
      dataset={helmRepos}
      description={<HelmDatatableDescription isAdmin={isAdminUser} />}
      settingsManager={tableState}
      columns={columns}
      title="Helm repositories"
      titleIcon={helm}
      titleId="helm-repositories"
      renderTableActions={(selectedRows) => (
        <HelmRepositoryDatatableActions selectedItems={selectedRows} />
      )}
      isLoading={helmReposQuery.isLoading}
      isRowSelectable={(row) => !row.original.Global}
      data-cy="helm-repositories-datatable"
    />
  );
}

function HelmDatatableDescription({ isAdmin }: { isAdmin: boolean }) {
  return (
    <TextTip color="blue" className="mb-3">
      <p>
        Adding a Helm repository here makes it available only in your Vessel HQ
        user account. The Helm charts from these repositories (along with the
        globally set Helm repository) are shown in the &apos;Create from
        Code&apos; screen.
      </p>
      {isAdmin && (
        <>
          To manage your helm repositories globally, navigate to{' '}
          <Link
            to="/settings"
            params={{ '#': 'kubernetes-settings' }}
            data-cy="helm-settings-link"
          >
            Settings &gt; General
          </Link>
          .
        </>
      )}
    </TextTip>
  );
}
