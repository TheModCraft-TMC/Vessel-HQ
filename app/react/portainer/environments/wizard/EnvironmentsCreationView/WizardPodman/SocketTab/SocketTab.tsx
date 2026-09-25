import {
  ContainerEngine,
  Environment,
} from '@/domains/environments';

import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { DeploymentScripts } from './DeploymentScripts';
import { SocketForm } from './SocketForm';

interface Props {
  onCreate(environment: Environment): void;
}

export function SocketTab({ onCreate }: Props) {
  return (
    <>
      <TextTip color="orange" className="mb-2" inline={false}>
        To connect via socket, the Vessel HQ server must be running in a Podman
        container.
      </TextTip>

      <DeploymentScripts />

      <div className="mt-5">
        <SocketForm
          onCreate={onCreate}
          containerEngine={ContainerEngine.Podman}
        />
      </div>
    </>
  );
}
