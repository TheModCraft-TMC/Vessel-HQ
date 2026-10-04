import type { ContainerMount } from '@/domains/containers/models';
import { Link } from '@/ui/components/links/Link';

interface Props {
  volume: ContainerMount;
  nodeName?: string;
}

export function VolumeRow({ volume, nodeName }: Props) {
  return (
    <tr>
      <td>{renderHostOrVolume()}</td>
      <td>{volume.Destination}</td>
    </tr>
  );

  function renderHostOrVolume() {
    if (volume.Type === 'volume' && volume.Name) {
      return (
        <Link
          to="/:endpointId/docker/volumes/:id"
          params={{
            id: volume.Name,
            nodeName,
          }}
          data-cy="volume-link"
        >
          {volume.Name}
        </Link>
      );
    }

    return volume.Source;
  }
}
