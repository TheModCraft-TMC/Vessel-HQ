import {
  KubernetesNamespaceContent,
  KubernetesNamespaceHeader,
} from '@app/_components/platform/kubernetes/KubernetesNamespacePages';

export default function Page() {
  return (
    <>
      <KubernetesNamespaceHeader />
      <KubernetesNamespaceContent />
    </>
  );
}
