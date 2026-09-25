import { Server, Trash2 } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { Icon } from '@/ui/components/icons/Icon';
import { TableContainer, TableTitle } from '@/ui/components/data-table';
import { Button } from '@/ui/components/buttons';
import { Link } from '@/ui/components/links/Link';
import { NetworkContainer } from '@/domains/networks/models/network';

import { DetailsTable } from '@@/DetailsTable';

type Props = {
  networkContainers: NetworkContainer[];
  nodeName: string;
  onDisconnect(containerId: string, nodeName?: string): void;
};

const tableHeaders = [
  'Container Name',
  'IPv4 Address',
  'IPv6 Address',
  'MacAddress',
  'Actions',
];

export function NetworkContainersTable({
  networkContainers,
  nodeName,
  onDisconnect,
}: Props) {
  if (networkContainers.length === 0) {
    return null;
  }

  return (
    <TableContainer>
      <TableTitle label="Containers in network" icon={Server} />
      <DetailsTable
        headers={tableHeaders}
        dataCy="networkDetails-networkContainers"
      >
        {networkContainers.map((container) => (
          <tr key={container.Id}>
            <td>
              <Link
                to="docker.containers.container"
                params={{
                  id: container.Id,
                  nodeName,
                }}
                title={container.Name}
                data-cy={`networkDetails-containerName-${container.Name}`}
              >
                {container.Name}
              </Link>
            </td>
            <td>{container.IPv4Address || '-'}</td>
            <td>{container.IPv6Address || '-'}</td>
            <td>{container.MacAddress || '-'}</td>
            <td>
              <Authorized authorizations="DockerNetworkDisconnect">
                <Button
                  data-cy={`networkDetails-disconnect${container.Name}`}
                  size="xsmall"
                  color="dangerlight"
                  onClick={() => {
                    if (container.Id) {
                      onDisconnect(container.Id, nodeName);
                    }
                  }}
                >
                  <Icon icon={Trash2} class-name="icon-secondary icon-md" />
                  Leave Network
                </Button>
              </Authorized>
            </td>
          </tr>
        ))}
      </DetailsTable>
    </TableContainer>
  );
}
