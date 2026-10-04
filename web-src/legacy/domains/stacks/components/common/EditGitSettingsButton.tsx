import { useRouteParams } from '@console/console/routing/useRouteParams';
import { useState } from 'react';
import { PencilIcon } from 'lucide-react';

import { Stack } from '@/domains/stacks/models/types';
import { Authorized } from '@/react/hooks/useUser';
import { Button } from '@/ui/components/buttons';

import { EditGitSettingsModal } from './EditGitSettings/EditGitSettingsModal';

export function EditGitSettingsButton({ stack }: { stack: Stack }) {
  const { openGitSettings } = useRouteParams();
  const [isOpen, setIsOpen] = useState(!!openGitSettings);

  return (
    <Authorized authorizations="PortainerStackUpdate">
      <Button
        size="small"
        color="default"
        onClick={() => setIsOpen(true)}
        data-cy="edit-git-settings-button"
        icon={PencilIcon}
      >
        Edit Git settings
      </Button>
      {isOpen && (
        <EditGitSettingsModal stack={stack} onClose={() => setIsOpen(false)} />
      )}
    </Authorized>
  );
}
