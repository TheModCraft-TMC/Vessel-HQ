import {
  KubernetesNamespaceAccessContent,
  KubernetesNamespaceAccessHeader,
} from '@console/console/platform/kubernetes/KubernetesNamespacePages';

export default function Page() {
  return (
    <>
      <KubernetesNamespaceAccessHeader />
      <KubernetesNamespaceAccessContent />
    </>
  );
}
