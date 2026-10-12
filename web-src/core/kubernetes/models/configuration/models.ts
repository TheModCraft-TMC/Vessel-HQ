export const KubernetesPortainerConfigurationOwnerLabel =
  'io.portainer.kubernetes.configuration.owner';
export const KubernetesPortainerConfigurationDataAnnotation =
  'io.portainer.kubernetes.configuration.data';

export const KubernetesSecretTypeOptions = {
  OPAQUE: { name: 'Opaque', value: 'Opaque' },
  SERVICEACCOUNTTOKEN: {
    name: 'Service account token',
    value: 'kubernetes.io/service-account-token',
  },
  DOCKERCFG: { name: 'Dockercfg', value: 'kubernetes.io/dockercfg' },
  DOCKERCONFIGJSON: {
    name: 'Dockerconfigjson',
    value: 'kubernetes.io/dockerconfigjson',
  },
  BASICAUTH: { name: 'Basic auth', value: 'kubernetes.io/basic-auth' },
  SSHAUTH: { name: 'SSH auth', value: 'kubernetes.io/ssh-auth' },
  TLS: { name: 'TLS', value: 'kubernetes.io/tls' },
  BOOTSTRAPTOKEN: {
    name: 'Bootstrap token',
    value: 'bootstrap.kubernetes.io/token',
  },
  CUSTOM: { name: 'Custom', value: 'Custom' },
} as const;
