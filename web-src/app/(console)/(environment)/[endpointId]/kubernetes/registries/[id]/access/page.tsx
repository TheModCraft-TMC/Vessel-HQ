'use client';

import { KubernetesRegistryAccessHeader } from '@console/console/platform/kubernetes/KubernetesAccessPages';

import { RegistryAccessContent } from '@/domains/clusters/cluster/RegistryAccessView/RegistryAccessView';

export default function Page() {
  return (
    <>
      <KubernetesRegistryAccessHeader />
      <RegistryAccessContent />
    </>
  );
}
