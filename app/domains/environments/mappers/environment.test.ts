import { zPortainerEndpoint } from '@api/zod.gen';
import type { PortainerEndpoint } from '@api/types.gen';

import { EnvironmentType } from '../types';

import { toEnvironment } from './environment';

describe('toEnvironment', () => {
  it('maps a validated endpoint response into the environment model', () => {
    const endpoint = zPortainerEndpoint.parse({
      Agent: { Version: '2.20.0' },
      ComposeSyntaxMaxVersion: '3.9',
      ContainerEngine: 'docker',
      Edge: {
        AsyncMode: false,
        CommandInterval: 5,
        PingInterval: 10,
        SnapshotInterval: 30,
      },
      EdgeCheckinInterval: 0,
      EdgeKey: '',
      GroupId: 1,
      Id: 7,
      Kubernetes: {
        Configuration: {
          AllowNoneIngressClass: true,
          IngressAvailabilityPerNamespace: false,
        },
        Flags: {
          IsServerIngressClassDetected: false,
          IsServerMetricsDetected: false,
          IsServerStorageDetected: false,
        },
      },
      LastCheckInDate: 0,
      Name: 'local',
      PublicURL: '',
      SecuritySettings: {
        allowBindMountsForRegularUsers: true,
        allowContainerCapabilitiesForRegularUsers: true,
        allowDeviceMappingForRegularUsers: true,
        allowHostNamespaceForRegularUsers: true,
        allowPrivilegedModeForRegularUsers: true,
        allowSecurityOptForRegularUsers: true,
        allowStackManagementForRegularUsers: true,
        allowSysctlSettingForRegularUsers: true,
        allowVolumeBrowserForRegularUsers: true,
        enableHostManagementFeatures: true,
      },
      TLSConfig: { TLS: false, TLSSkipVerify: false },
      Type: EnvironmentType.Docker,
      URL: 'unix:///var/run/docker.sock',
    }) as unknown as PortainerEndpoint;

    const environment = toEnvironment(endpoint);

    expect(environment).toMatchObject({
      Id: 7,
      Name: 'local',
      Type: EnvironmentType.Docker,
      ContainerEngine: 'docker',
      Status: 2,
      Snapshots: [],
      Agent: { Version: '2.20.0', IsOutdated: false },
      Edge: { PingInterval: 10, SnapshotInterval: 30 },
    });
  });
});
