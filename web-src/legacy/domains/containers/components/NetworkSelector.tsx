import { useMemo } from 'react';

import { useNetworksForSelector } from '@/domains/containers';
import { useNetworkSelectorCapabilities } from '@/domains/containers';
import { Option, PortainerSelect } from '@/ui/components/forms/PortainerSelect';

export function NetworkSelector({
  onChange,
  additionalOptions = [],
  value,
  hiddenNetworks = [],
}: {
  value: string;
  additionalOptions?: Array<Option<string>>;
  onChange: (value: string) => void;
  hiddenNetworks?: string[];
}) {
  const podmanCapabilities = useNetworkSelectorCapabilities();
  const networksQuery = useNetworksForSelector({
    select(networks) {
      return networks.map((n) => {
        // The name of the 'bridge' network is 'podman' in Podman
        if (n.Name === 'bridge' && podmanCapabilities.engine === 'podman') {
          return {
            label: podmanCapabilities.defaultNetworkName,
            value: podmanCapabilities.defaultNetworkName,
          };
        }
        return { label: n.Name, value: n.Name };
      });
    },
  });

  const networks = networksQuery.data;

  const options = useMemo(
    () =>
      (networks || [])
        .concat(additionalOptions)
        .filter((n) => !hiddenNetworks.includes(n.value))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [additionalOptions, hiddenNetworks, networks]
  );

  return (
    <PortainerSelect
      value={value}
      onChange={onChange}
      options={options}
      isLoading={networksQuery.isLoading}
      bindToBody
      placeholder="Select a network"
      data-cy="docker-network-selector"
    />
  );
}
