import { DatabaseIcon } from 'lucide-react';

import type { ContainerMount } from '@/domains/containers/models';

import { Widget, WidgetBody } from '@@/Widget';
import { DetailsTable } from '@@/DetailsTable';

import { VolumeRow } from './VolumeRow';

interface Props {
  volumes: Array<ContainerMount> | undefined;
  nodeName?: string;
}

export function VolumesSection({ volumes, nodeName }: Props) {
  if (!volumes || volumes.length === 0) {
    return null;
  }

  return (
    <Widget>
      <Widget.Title icon={DatabaseIcon} title="Volumes" />
      <WidgetBody className="no-padding">
        <DetailsTable
          dataCy="containerDetails-volumesTable"
          headers={['Host/volume', 'Path in container']}
        >
          {volumes.map((volume) => (
            <VolumeRow
              key={
                volume.Type === 'volume'
                  ? volume.Name
                  : volume.Source || volume.Destination
              }
              volume={volume}
              nodeName={nodeName}
            />
          ))}
        </DetailsTable>
      </WidgetBody>
    </Widget>
  );
}
