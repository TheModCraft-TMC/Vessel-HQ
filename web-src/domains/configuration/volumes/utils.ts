import { v4 as uuidv4 } from 'uuid';

import { PersistentVolume, VolumeViewModel } from './ListView/types';

export function isVolumeUsed(volume: VolumeViewModel) {
  return volume.Applications.length !== 0;
}

export function isPersistentVolumeUsed(volume: PersistentVolume) {
  return volume.claimRef !== null;
}

export function generatedApplicationConfigVolumeName(applicationName: string) {
  return `config-${applicationName}-${uuidv4()}`;
}
