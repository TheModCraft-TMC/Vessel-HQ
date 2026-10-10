'use client';

import { KubernetesRegistryAccessHeader } from '@app/_components/platform/kubernetes/KubernetesAccessPages';
import { RegistryAccessContent } from '@app/_components/platform/kubernetes/cluster/RegistryAccessView/RegistryAccessView';

export default function Page() {
  return (
    <>
      <KubernetesRegistryAccessHeader />
      <RegistryAccessContent />
    </>
  );
}
