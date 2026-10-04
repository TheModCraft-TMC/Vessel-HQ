import {
  KubernetesServiceAccountContent,
  KubernetesServiceAccountHeader,
} from '@console/console/platform/kubernetes/KubernetesAccessPages';

export default function Page() {
  return (
    <>
      <KubernetesServiceAccountHeader />
      <KubernetesServiceAccountContent />
    </>
  );
}
