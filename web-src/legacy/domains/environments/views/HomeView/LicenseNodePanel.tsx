import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { useNodesCount } from '@/react/portainer/system/useNodesCount';
import { useLicenseInfo } from '@/react/portainer/licenses/use-license.service';
import { LicenseType } from '@/react/portainer/licenses/types';

import { InformationPanel } from '@@/InformationPanel';

export function LicenseNodePanel() {
  const nodesValid = useNodesValid();

  if (nodesValid) {
    return null;
  }

  return (
    <InformationPanel title="License node allowance exceeded">
      <TextTip>
        The number of nodes for your license has been exceeded. Please contact
        your administrator.
      </TextTip>
    </InformationPanel>
  );
}

function useNodesValid() {
  const { isLoading: isLoadingNodes, data: nodesCount = 0 } = useNodesCount();

  const { isLoading: isLoadingLicense, info } = useLicenseInfo();
  if (
    isLoadingLicense ||
    isLoadingNodes ||
    !info ||
    info.type === LicenseType.Trial
  ) {
    return true;
  }

  return nodesCount <= info.nodes;
}
