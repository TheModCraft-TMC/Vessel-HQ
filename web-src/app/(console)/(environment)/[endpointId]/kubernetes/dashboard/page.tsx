import {
  KubernetesDashboardContent,
  KubernetesDashboardHeader,
} from '@app/_components/platform/kubernetes/KubernetesDashboardPage';

export default function Page() {
  return (
    <>
      <KubernetesDashboardHeader />
      <KubernetesDashboardContent />
    </>
  );
}
