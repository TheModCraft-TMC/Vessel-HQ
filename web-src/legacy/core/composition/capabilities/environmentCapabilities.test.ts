import { EnvironmentType } from '@/domains/environments';

import { selectInfrastructureProvider } from '../infrastructure-providers';

import { getEnvironmentCapabilities } from './environmentCapabilities';

describe('getEnvironmentCapabilities', () => {
  it('selects Docker capabilities for Docker environments', () => {
    expect(
      getEnvironmentCapabilities({ Type: EnvironmentType.Docker })
    ).toMatchObject({
      supportsContainerOperations: true,
      supportsKubernetesOperations: false,
      supportsEdgeOperations: false,
      supportsAzureOperations: false,
    });
  });

  it('selects Edge capabilities without provider-name checks in domains', () => {
    expect(
      getEnvironmentCapabilities({
        Type: EnvironmentType.EdgeAgentOnKubernetes,
      })
    ).toMatchObject({
      supportsContainerOperations: false,
      supportsKubernetesOperations: false,
      supportsEdgeOperations: true,
      supportsAzureOperations: false,
    });
  });

  it('selects Azure capabilities for Azure environments', () => {
    expect(
      getEnvironmentCapabilities({ Type: EnvironmentType.Azure })
    ).toMatchObject({
      supportsAzureOperations: true,
      supportsRegistryOperations: true,
    });
  });

  it('selects infrastructure providers centrally', () => {
    expect(selectInfrastructureProvider(EnvironmentType.Azure)).toBe(
      'azure-aci'
    );
    expect(
      selectInfrastructureProvider(EnvironmentType.AgentOnKubernetes)
    ).toBe('kubernetes');
    expect(
      selectInfrastructureProvider(EnvironmentType.EdgeAgentOnDocker)
    ).toBe('edge-agent');
    expect(selectInfrastructureProvider(EnvironmentType.Docker)).toBe('docker');
  });
});
