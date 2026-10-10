import {
  KubernetesServiceAccountContent,
  KubernetesServiceAccountHeader,
} from '@app/_components/platform/kubernetes/KubernetesAccessPages';

export default function Page() {
  return (
    <>
      <KubernetesServiceAccountHeader />
      <KubernetesServiceAccountContent />
    </>
  );
}
