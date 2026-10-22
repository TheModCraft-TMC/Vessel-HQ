import { http, HttpResponse } from 'msw';

export const endpointsHandlers = [
  http.get('/api/endpoints', () => HttpResponse.json([])),
  http.get('/api/endpoints/agent_versions', () => HttpResponse.json([])),
  http.get('/api/endpoints/:endpointId', ({ params }) =>
    HttpResponse.json(createEnvironment(Number.parseInt(params.endpointId as string, 10)))
  ),
  http.get('/api/endpoints/:endpointId/registries', () =>
    HttpResponse.json([])
  ),
  http.get('/api/endpoints/:endpointId/registries/:id', () =>
    HttpResponse.json({})
  ),
];

function createEnvironment(id: number) {
  return {
    Id: id,
    TagIds: [],
    GroupId: 1,
    Type: 1,
    ContainerEngine: 'docker',
    Name: 'environment',
    Status: 1,
    URL: 'url',
    Snapshots: [],
    Kubernetes: {
      Flags: {
        IsServerMetricsDetected: true,
        IsServerIngressClassDetected: true,
        IsServerStorageDetected: true,
      },
      Snapshots: [],
      Configuration: {
        IngressClasses: [],
        IngressAvailabilityPerNamespace: false,
        AllowNoneIngressClass: false,
      },
    },
    UserAccessPolicies: {},
    TeamAccessPolicies: {},
    ComposeSyntaxMaxVersion: '0',
    EdgeKey: '',
    EnableGPUManagement: false,
    UserTrusted: false,
    Edge: {
      AsyncMode: false,
      PingInterval: 0,
      CommandInterval: 0,
      SnapshotInterval: 0,
    },
    SecuritySettings: {
      allowBindMountsForRegularUsers: false,
      allowPrivilegedModeForRegularUsers: false,
      allowContainerCapabilitiesForRegularUsers: false,
      allowDeviceMappingForRegularUsers: false,
      allowHostNamespaceForRegularUsers: false,
      allowStackManagementForRegularUsers: false,
      allowSysctlSettingForRegularUsers: false,
      allowSecurityOptForRegularUsers: false,
      allowVolumeBrowserForRegularUsers: false,
      enableHostManagementFeatures: false,
    },
    DeploymentOptions: {
      overrideGlobalOptions: false,
      hideAddWithForm: true,
      hideWebEditor: false,
      hideFileUpload: false,
    },
    Gpus: [],
    Agent: { Version: '1.0.0' },
    EnableImageNotification: false,
    ChangeWindow: { Enabled: false, EndTime: '', StartTime: '' },
    StatusMessage: { detail: '', summary: '' },
    AzureCredentials: {
      ApplicationID: '',
      AuthenticationKey: '',
      TenantID: '',
    },
    EdgeCheckinInterval: 0,
    PublicURL: '',
    TLSConfig: { TLS: false, TLSSkipVerify: false },
    LastCheckInDate: 0,
  };
}
