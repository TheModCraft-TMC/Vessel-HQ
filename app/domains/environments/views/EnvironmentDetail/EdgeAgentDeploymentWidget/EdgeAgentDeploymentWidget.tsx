import { compact } from 'lodash';

import { EdgeScriptForm, commandsTabs } from '@/domains/edge';
import { FormSection } from '@/ui/components/forms/FormSection';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';

import { Widget, WidgetBody } from '@@/Widget';

import { EdgeKeyDisplay } from '../EdgeKeyDisplay';

interface Props {
  edgeKey: string;
  edgeId?: string;
  asyncMode?: boolean;
}

interface EdgeKeyDetails {
  instanceURL: string;
  tunnelServerAddr: string;
}

export function EdgeAgentDeploymentWidget({
  edgeKey,
  edgeId,
  asyncMode,
}: Props) {
  const edgeScriptCommands = {
    linux: compact([
      commandsTabs.k8sLinux,
      commandsTabs.swarmLinux,
      commandsTabs.standaloneLinux,
      commandsTabs.podmanLinux,
    ]),
    win: [commandsTabs.swarmWindows, commandsTabs.standaloneWindow],
  };

  const edgeKeyDetails = decodeEdgeKey(edgeKey);

  return (
    <Widget>
      <WidgetBody>
        <FormSection title="Deploy an agent">
          <TextTip color="blue">
            Refer to the platform related command below to deploy the Edge agent
            in your remote cluster. <br />
            The agent will communicate with Vessel HQ via{' '}
            <u>{edgeKeyDetails.instanceURL}</u> and{' '}
            <u>tcp://{edgeKeyDetails.tunnelServerAddr}</u>
          </TextTip>
        </FormSection>

        <FormSection title="Edge agent deployment script">
          <EdgeScriptForm
            edgeInfo={{ key: edgeKey, id: edgeId }}
            commands={edgeScriptCommands}
            asyncMode={asyncMode}
          />
        </FormSection>

        <EdgeKeyDisplay edgeKey={edgeKey} />
      </WidgetBody>
    </Widget>
  );
}

function decodeEdgeKey(key: string): EdgeKeyDetails {
  if (!key) {
    return { instanceURL: '', tunnelServerAddr: '' };
  }

  try {
    const decodedKey = atob(key).split('|');
    return {
      instanceURL: decodedKey[0] || '',
      tunnelServerAddr: decodedKey[1] || '',
    };
  } catch {
    // Invalid base64, return empty strings
    return { instanceURL: '', tunnelServerAddr: '' };
  }
}
