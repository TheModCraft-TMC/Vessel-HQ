import { useEnvironmentId } from '@/core/routing/useEnvironmentId';
import { useInfoPanelState } from '@/core/hooks/useInfoPanelState';
import { TextTip } from '@/ui/components/feedback/Tip/TextTip';
import { InformationPanel } from '@/ui/components/feedback/InformationPanel';
import { HelpLink } from '@/ui/components/HelpLink';
import { useInfo } from '@/core/composition/useDockerInfo';

const infoPanelId = 'docker-dashboard-info-01';

export function NonAgentSwarmInfo() {
  const { isVisible, dismiss } = useInfoPanelState(infoPanelId);
  const envId = useEnvironmentId();
  const isManagerQuery = useInfo(envId, {
    select: (info) => !!info.Swarm?.ControlAvailable,
  });
  if (!isVisible || isManagerQuery.isLoading) {
    return null;
  }

  const isManager = isManagerQuery.data;

  return (
    <InformationPanel title="Information" onDismiss={() => dismiss()}>
      <TextTip color="blue">
        {isManager ? (
          <>
            Vessel HQ is connected to a node that is part of a Swarm cluster.
            Some resources located on other nodes in the cluster might not be
            available for management, have a look at{' '}
            <HelpLink
              docLink="/admin/environments/add/swarm/agent"
              target="_blank"
            >
              our agent setup
            </HelpLink>{' '}
            for more details.
          </>
        ) : (
          <>
            Vessel HQ is connected to a worker node. Swarm management features
            will not be available.
          </>
        )}
      </TextTip>
    </InformationPanel>
  );
}
