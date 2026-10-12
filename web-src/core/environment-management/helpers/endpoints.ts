export function getAgentShortVersion(agentVersion: string) {
  const [major, minor] = agentVersion.split('.');
  return `${major}-${minor}`;
}
