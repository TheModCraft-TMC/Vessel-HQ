import { useState } from 'react';
import { useFormikContext } from 'formik';
import { Network } from 'lucide-react';

import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { PortainerTunnelAddrField } from '@/react/portainer/common/PortainerTunnelAddrField';
import { PortainerUrlField } from '@/react/portainer/common/PortainerUrlField';
import { NameField } from '@/react/portainer/environments/common/NameField/NameField';
import { ContainerEngine } from '@/domains/environments';
import {
  ConnectivityEnvironment,
  ConnectivityTestModal,
} from '@/domains/edge/components/ConnectivityTestModal/ConnectivityTestModal';
import { Button } from '@/ui/components/buttons';

import { FormValues } from './types';

interface EdgeAgentFormProps {
  readonly?: boolean;
  asyncMode?: boolean;
  containerEngine?: ContainerEngine;
}

export function EdgeAgentFieldset({
  readonly,
  asyncMode,
  containerEngine = ContainerEngine.Docker,
}: EdgeAgentFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { values } = useFormikContext<FormValues>();

  const showTunnelField = isBE && !asyncMode;
  const environment = toConnectivityEnvironment(containerEngine);

  return (
    <>
      <NameField readonly={readonly} />
      <PortainerUrlField
        fieldName="portainerUrl"
        readonly={readonly}
        required
      />
      {showTunnelField && (
        <PortainerTunnelAddrField
          fieldName="tunnelServerAddr"
          readonly={readonly}
          required
        />
      )}

      <div className="form-group">
        <div className="col-sm-12">
          <Button
            color="default"
            className="!ml-0"
            icon={Network}
            onClick={() => setIsModalOpen(true)}
            data-cy="edge-agent-test-connectivity-button"
          >
            Test connectivity
          </Button>
        </div>
      </div>

      {isModalOpen && (
        <ConnectivityTestModal
          portainerUrl={values.portainerUrl}
          tunnelServerAddr={
            showTunnelField ? values.tunnelServerAddr : undefined
          }
          environment={environment}
          onDismiss={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}

function toConnectivityEnvironment(
  containerEngine: ContainerEngine
): ConnectivityEnvironment {
  switch (containerEngine) {
    case ContainerEngine.Kubernetes:
      return 'kubernetes';
    case ContainerEngine.Podman:
      return 'podman';
    case ContainerEngine.Docker:
    default:
      return 'docker';
  }
}
