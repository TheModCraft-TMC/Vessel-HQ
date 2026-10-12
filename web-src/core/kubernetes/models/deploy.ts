export const KubernetesDeployManifestTypes = {
  KUBERNETES: 1,
} as const;

export const KubernetesDeployBuildMethods = {
  GIT: 1,
  WEB_EDITOR: 2,
  CUSTOM_TEMPLATE: 3,
  URL: 4,
  HELM: 5,
} as const;

export const KubernetesDeployRequestMethods = {
  REPOSITORY: 'repository',
  STRING: 'string',
  URL: 'url',
} as const;

export const RepositoryMechanismTypes = {
  WEBHOOK: 'Webhook',
} as const;
