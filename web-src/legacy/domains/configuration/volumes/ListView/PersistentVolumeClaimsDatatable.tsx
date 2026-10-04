import { Database } from 'lucide-react';
import { useState } from 'react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { usePersistentVolumeClaims } from '@/domains/configuration/volumes/queries/usePersistentVolumeClaims';
import { useDeletePersistentVolumeClaims } from '@/domains/configuration/volumes/queries/useDeletePersistentVolumeClaims';
import { ResizeClaimEditForm } from '@/domains/configuration/volumes/ListView/ResizeClaimEditForm';
import { isSystemNamespace, useNamespacesQuery } from '@/domains/namespaces';
import { refreshableSettings } from '@/ui/components/data-table/types';
import { Datatable, TableSettingsMenu } from '@/ui/components/data-table';
import { useTableStateWithStorage } from '@/ui/components/data-table/useTableState';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { Modal } from '@/ui/components/dialog';
import {
  systemResourcesSettings,
  CreateFromManifestButton,
  DefaultDatatableSettings,
  SystemResourceDescription,
} from '@/domains/clusters';
import type { KubeTableSettings as TableSettings } from '@/domains/clusters';

import { createPersistentVolumeClaimsColumns } from './persistentVolumeClaimsColumns';
import { PersistentVolumeClaim } from './types';

export function PersistentVolumeClaimsDatatable() {
  const [editResizeClaim, setEditResizeClaim] =
    useState<PersistentVolumeClaim | null>(null);
  const tableState = useTableStateWithStorage<TableSettings>(
    'kube-volumes-pvc',
    'name',
    (set) => ({
      ...systemResourcesSettings(set),
      ...refreshableSettings(set),
    })
  );

  const { authorized: hasWriteAuth } = useAuthorizations(
    'K8sVolumesW',
    undefined,
    false
  );

  const envId = useEnvironmentId();
  const namespacesQuery = useNamespacesQuery(envId);
  const namespaces = namespacesQuery.data ?? [];
  const deleteClaimsMutation = useDeletePersistentVolumeClaims(envId);
  const claimsQuery = usePersistentVolumeClaims(envId, {
    select: filterVolumeClaims,
  });
  const claims = claimsQuery.data ?? [];
  const columns = createPersistentVolumeClaimsColumns((claim) =>
    setEditResizeClaim(claim)
  );

  return (
    <>
      <Datatable<PersistentVolumeClaim>
        data-cy="k8s-persistentvolumeclaims-datatable"
        isLoading={claimsQuery.isLoading}
        dataset={claims}
        columns={columns}
        settingsManager={tableState}
        title="Volume claims"
        titleIcon={Database}
        disableSelect={!hasWriteAuth}
        isRowSelectable={({ original: claim }) =>
          !claim.owningApplications?.length
        }
        renderTableActions={(selectedItems) => (
          <Authorized authorizations="K8sVolumesW">
            <DeleteButton
              confirmMessage="Do you want to remove the selected volume claim(s)?"
              onConfirmed={() => deleteClaimsMutation.mutate(selectedItems)}
              disabled={selectedItems.length === 0}
              isLoading={deleteClaimsMutation.isLoading}
              data-cy="k8s-persistentvolumeclaims-delete-button"
            />
            <CreateFromManifestButton data-cy="k8s-persistentvolumeclaims-deploy-button" />
          </Authorized>
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
      />

      {editResizeClaim && (
        <Modal
          onDismiss={() => setEditResizeClaim(null)}
          size="md"
          aria-label="Resize Persistent Volume Claim"
        >
          <ResizeClaimEditForm
            claim={editResizeClaim}
            onDismiss={() => setEditResizeClaim(null)}
          />
        </Modal>
      )}
    </>
  );

  function filterVolumeClaims(
    claims: PersistentVolumeClaim[]
  ): PersistentVolumeClaim[] {
    return claims.filter(
      (claim) =>
        tableState.showSystemResources ||
        !isSystemNamespace(claim.namespace, namespaces)
    );
  }
}
