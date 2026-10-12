import { useSettings } from '@/domains/settings';
import { useSystemStatus } from '@/core/system/useSystemStatus';

export function useAgentDetails() {
  const settingsQuery = useSettings();

  const versionQuery = useSystemStatus({ select: (status) => status.Version });

  if (!versionQuery.isSuccess || !settingsQuery.isSuccess) {
    return null;
  }

  const agentVersion = versionQuery.data;

  return {
    agentVersion,
    agentSecret: settingsQuery.data.AgentSecret,
  };
}
