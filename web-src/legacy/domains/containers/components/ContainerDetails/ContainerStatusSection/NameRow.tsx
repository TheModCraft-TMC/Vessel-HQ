import { useState } from 'react';
import { Edit } from 'lucide-react';

import { EnvironmentId } from '@/domains/environments';
import { ContainerId } from '@/domains/containers/types';
import { Authorized } from '@/react/hooks/useUser';
import { trimContainerName } from '@/domains/containers/utils';
import { Button } from '@/ui/components/buttons';
import { Icon } from '@/ui/components/icons/Icon';

import { EditNameForm } from './EditNameForm';

export function NameRow({
  containerId,
  containerName,
  environmentId,
  nodeName,
  onSuccess = () => {},
}: {
  containerId: ContainerId;
  containerName: string;
  environmentId: EnvironmentId;
  nodeName?: string;
  onSuccess?(): void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  function handleEdit() {
    setIsEditing(true);
  }

  if (!isEditing) {
    return (
      <>
        {trimContainerName(containerName)}
        <Authorized authorizations="DockerContainerRename">
          <Button
            size="xsmall"
            color="none"
            className="!ml-1 !p-0 hover:no-underline"
            onClick={handleEdit}
            data-cy="container-edit-name-button"
            title="Edit container name"
            aria-label="Edit container name"
          >
            <Icon icon={Edit} className="lucide" />
          </Button>
        </Authorized>
      </>
    );
  }

  return (
    <EditNameForm
      onSuccess={() => {
        setIsEditing(false);
        onSuccess();
      }}
      onCancel={() => {
        setIsEditing(false);
      }}
      containerId={containerId}
      environmentId={environmentId}
      name={containerName}
      nodeName={nodeName}
    />
  );
}
