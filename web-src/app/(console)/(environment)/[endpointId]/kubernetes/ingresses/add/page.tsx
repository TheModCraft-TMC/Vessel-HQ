'use client';

import { KubernetesIngressEditorHeader } from '@console/console/platform/kubernetes/KubernetesIngressPages';

import { IngressEditorContent } from '@/domains/ingress/ingresses/CreateIngressView/CreateIngressView';

export default function Page() {
  return (
    <>
      <KubernetesIngressEditorHeader isEdit={false} />
      <IngressEditorContent />
    </>
  );
}
