'use client';

import {
  ClusterPageHeader,
  KubernetesConfigureContent,
} from '@app/_components/platform/kubernetes/KubernetesClusterPages';
import { useCurrentEnvironment } from '@/core/composition/useCurrentEnvironment';
import { useUnauthorizedRedirect } from '@/core/routing/useUnauthorizedRedirect';

export default function Page() {
  const { data: environment } = useCurrentEnvironment();
  useUnauthorizedRedirect(
    { authorizations: 'K8sClusterW', adminOnlyCE: false },
    {
      params: { id: environment?.Id },
      to: '/:endpointId/kubernetes/dashboard',
    }
  );

  return (
    <>
      <ClusterPageHeader
        environment={environment}
        suffix="Kubernetes configuration"
        title="Kubernetes features configuration"
      />
      <KubernetesConfigureContent />
    </>
  );
}
