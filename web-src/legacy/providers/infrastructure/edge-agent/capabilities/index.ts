export interface EdgeAgentCapabilities {
  supportsWaitingRoom: boolean;
  supportsDeploymentScripts: boolean;
  supportsConnectivityTest: boolean;
}

export const edgeAgentCapabilities: EdgeAgentCapabilities = {
  supportsWaitingRoom: true,
  supportsDeploymentScripts: true,
  supportsConnectivityTest: true,
};
