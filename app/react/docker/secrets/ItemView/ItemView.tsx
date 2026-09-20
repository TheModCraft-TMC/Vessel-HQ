import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { Lock } from 'lucide-react';

import { SecretViewModel } from '@/docker/models/secret';
import { isoDate } from '@/portainer/filters/filters';
import { notifySuccess } from '@/portainer/services/notifications';
import { withError } from '@/react-tools/react-query';
import { getSecret } from '@/react/docker/proxy/queries/secrets/useSecret';
import { removeSecret } from '@/react/docker/proxy/queries/secrets/useRemoveSecretMutation';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Authorized } from '@/react/hooks/useUser';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlType } from '@/react/portainer/access-control/types';

import { DeleteButton } from '@@/buttons/DeleteButton';
import { DetailsTable } from '@@/DetailsTable';
import { PageHeader } from '@@/PageHeader';
import { TableContainer, TableTitle } from '@@/datatables';

export function ItemView() {
  const environmentId = useEnvironmentId();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const queryKey = ['docker', environmentId, 'secrets', id] as const;
  const secretQuery = useQuery(
    queryKey,
    async () => new SecretViewModel(await getSecret(environmentId, id)),
    withError('Unable to retrieve secret')
  );
  const removeMutation = useMutation(
    () => removeSecret(environmentId, id),
    withError('Unable to remove secret')
  );

  if (!secretQuery.data) {
    return null;
  }

  const secret = secretQuery.data;

  return (
    <>
      <PageHeader
        title="Secret details"
        breadcrumbs={[
          { label: 'Secrets', link: 'docker.secrets' },
          secret.Name,
        ]}
        reload
      />

      <TableContainer>
        <TableTitle label="Secret details" icon={Lock} />
        <DetailsTable dataCy="secretDetails-detailsTable">
          <DetailsTable.Row label="Name">{secret.Name}</DetailsTable.Row>
          <DetailsTable.Row label="ID">
            {secret.Id}
            <span className="ml-2">
              <Authorized authorizations="DockerSecretDelete">
                <DeleteButton
                  data-cy="secretDetails-deleteSecret"
                  size="xsmall"
                  onConfirmed={handleRemove}
                  confirmMessage="Do you want to delete this secret?"
                >
                  Delete this secret
                </DeleteButton>
              </Authorized>
            </span>
          </DetailsTable.Row>
          <DetailsTable.Row label="Created">
            {isoDate(secret.CreatedAt)}
          </DetailsTable.Row>
          <DetailsTable.Row label="Last updated">
            {isoDate(secret.UpdatedAt)}
          </DetailsTable.Row>
          {Object.keys(secret.Labels).length > 0 && (
            <DetailsTable.Row label="Labels">
              <table className="table-bordered table-condensed table">
                <tbody>
                  {Object.entries(secret.Labels).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DetailsTable.Row>
          )}
        </DetailsTable>
      </TableContainer>

      <AccessControlPanel
        resourceId={secret.Id}
        resourceControl={secret.ResourceControl}
        resourceType={ResourceControlType.Secret}
        environmentId={environmentId}
        onUpdateSuccess={() => queryClient.invalidateQueries(queryKey)}
      />
    </>
  );

  function handleRemove() {
    removeMutation.mutate(undefined, {
      onSuccess: () => {
        notifySuccess('Secret successfully removed', secret.Name);
        router.stateService.go('docker.secrets');
      },
    });
  }
}
