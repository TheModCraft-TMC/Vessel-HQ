import {
  KubernetesNamespaceAccessContent,
  KubernetesNamespaceAccessHeader,
} from '@app/_components/platform/kubernetes/KubernetesNamespacePages';

export default function Page() {
  return (
    <>
      <KubernetesNamespaceAccessHeader />
      <KubernetesNamespaceAccessContent />
    </>
  );
}
