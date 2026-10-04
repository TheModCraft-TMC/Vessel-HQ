import {
  KubernetesDashboardContent,
  KubernetesDashboardHeader,
} from '@console/console/platform/kubernetes/KubernetesDashboardPage';

export default function Page() {
  return (
    <>
      <KubernetesDashboardHeader />
      <KubernetesDashboardContent />
    </>
  );
}
