import { Authorized } from '@/react/hooks/useUser';
import { AddButton } from '@/ui/components/buttons';
import { DeleteButton } from '@/ui/components/buttons/DeleteButton';

import { DecoratedVolume } from '../../models/types';

export function TableActions({
  selectedItems,
  onRemove,
}: {
  selectedItems: Array<DecoratedVolume>;
  onRemove(items: Array<DecoratedVolume>): void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Authorized authorizations="DockerVolumeDelete">
        <DeleteButton
          disabled={selectedItems.length === 0}
          onConfirmed={() => onRemove(selectedItems)}
          confirmMessage="Do you want to remove the selected volume(s)?"
          data-cy="volume-removeVolumeButton"
        />
      </Authorized>
      <Authorized authorizations="DockerVolumeCreate">
        <AddButton data-cy="volume-addVolumeButton">Add volume</AddButton>
      </Authorized>
    </div>
  );
}
