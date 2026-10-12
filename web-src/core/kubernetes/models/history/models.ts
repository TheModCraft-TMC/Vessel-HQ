export const KubernetesSystem_DefaultDeploymentUniqueLabelKey =
  'pod-template-hash';
export const KubernetesSystem_RevisionAnnotation =
  'deployment.kubernetes.io/revision';
export const KubernetesSystem_RevisionHistoryAnnotation =
  'deployment.kubernetes.io/revision-history';
export const KubernetesSystem_DesiredReplicasAnnotation =
  'deployment.kubernetes.io/desired-replicas';
export const KubernetesSystem_MaxReplicasAnnotation =
  'deployment.kubernetes.io/max-replicas';

const LastAppliedConfigAnnotation =
  'kubectl.kubernetes.io/last-applied-configuration';
const DeprecatedRollbackTo = 'deprecated.deployment.rollback.to';

export const KubernetesSystem_AnnotationsToSkip: Record<string, true> = {
  [LastAppliedConfigAnnotation]: true,
  [KubernetesSystem_RevisionAnnotation]: true,
  [KubernetesSystem_RevisionHistoryAnnotation]: true,
  [KubernetesSystem_DesiredReplicasAnnotation]: true,
  [KubernetesSystem_MaxReplicasAnnotation]: true,
  [DeprecatedRollbackTo]: true,
};
