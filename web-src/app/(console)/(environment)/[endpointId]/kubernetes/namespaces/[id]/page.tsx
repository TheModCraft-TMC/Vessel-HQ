import {
  KubernetesNamespaceContent,
  KubernetesNamespaceHeader,
} from '@console/console/platform/kubernetes/KubernetesNamespacePages';

export default function Page() {
  return (
    <>
      <KubernetesNamespaceHeader />
      <KubernetesNamespaceContent />
    </>
  );
}
