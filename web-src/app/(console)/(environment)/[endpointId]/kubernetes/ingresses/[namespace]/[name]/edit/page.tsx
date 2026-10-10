'use client';

import { KubernetesIngressEditorHeader } from '@app/_components/platform/kubernetes/KubernetesIngressPages';
import { IngressEditorContent } from '@app/_components/platform/kubernetes/ingress/CreateIngressView/CreateIngressView';

export default function Page() {
  return (
    <>
      <KubernetesIngressEditorHeader isEdit />
      <IngressEditorContent />
    </>
  );
}
