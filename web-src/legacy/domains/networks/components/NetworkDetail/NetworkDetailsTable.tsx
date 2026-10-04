import { Fragment } from 'react';
import { Network } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';
import { TableContainer, TableTitle } from '@/ui/components/data-table';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';
import { DockerNetwork, IPConfig } from '@/domains/networks/models/network';

import { DetailsTable } from '@@/DetailsTable';

interface Props {
  network: DockerNetwork;
  ipv4Configs: IPConfig[];
  ipv6Configs: IPConfig[];
  allowRemoveNetwork: boolean;
  onRemoveNetworkClicked: () => void;
}

export function NetworkDetailsTable({
  network,
  ipv4Configs,
  ipv6Configs,
  allowRemoveNetwork,
  onRemoveNetworkClicked,
}: Props) {
  return (
    <TableContainer>
      <TableTitle label="Network details" icon={Network} />
      <DetailsTable dataCy="networkDetails-detailsTable">
        {/* networkRowContent */}
        <DetailsTable.Row label="Name">{network.Name}</DetailsTable.Row>
        <DetailsTable.Row label="Id">
          {network.Id}
          {allowRemoveNetwork && (
            <span className="ml-2">
              <Authorized authorizations="DockerNetworkDelete">
                <DeleteButton
                  data-cy="networkDetails-deleteNetwork"
                  size="xsmall"
                  onConfirmed={onRemoveNetworkClicked}
                  confirmMessage="Do you want to delete the network?"
                >
                  Delete this network
                </DeleteButton>
              </Authorized>
            </span>
          )}
        </DetailsTable.Row>
        <DetailsTable.Row label="Driver">{network.Driver}</DetailsTable.Row>
        <DetailsTable.Row label="Scope">{network.Scope}</DetailsTable.Row>
        <DetailsTable.Row label="Attachable">
          {String(network.Attachable)}
        </DetailsTable.Row>
        <DetailsTable.Row label="Internal">
          {String(network.Internal)}
        </DetailsTable.Row>

        {/* IPV4 ConfigRowContent */}
        {ipv4Configs.map((config) => (
          <Fragment key={config.Subnet}>
            <DetailsTable.Row
              label={`IPV4 Subnet${getConfigDetails(config.Subnet)}`}
            >
              {`IPV4 Gateway${getConfigDetails(config.Gateway)}`}
            </DetailsTable.Row>
            <DetailsTable.Row
              label={`IPV4 IP Range${getConfigDetails(config.IPRange)}`}
            >
              {`IPV4 Excluded IPs${getAuxiliaryAddresses(
                config.AuxiliaryAddresses
              )}`}
            </DetailsTable.Row>
          </Fragment>
        ))}

        {/* IPV6 ConfigRowContent */}
        {ipv6Configs.map((config) => (
          <Fragment key={config.Subnet}>
            <DetailsTable.Row
              label={`IPV6 Subnet${getConfigDetails(config.Subnet)}`}
            >
              {`IPV6 Gateway${getConfigDetails(config.Gateway)}`}
            </DetailsTable.Row>
            <DetailsTable.Row
              label={`IPV6 IP Range${getConfigDetails(config.IPRange)}`}
            >
              {`IPV6 Excluded IPs${getAuxiliaryAddresses(
                config.AuxiliaryAddresses
              )}`}
            </DetailsTable.Row>
          </Fragment>
        ))}
      </DetailsTable>
    </TableContainer>
  );

  function getConfigDetails(configValue?: string) {
    return configValue ? ` - ${configValue}` : '';
  }

  function getAuxiliaryAddresses(auxiliaryAddresses?: object) {
    return auxiliaryAddresses
      ? ` - ${Object.values(auxiliaryAddresses).join(' - ')}`
      : '';
  }
}
