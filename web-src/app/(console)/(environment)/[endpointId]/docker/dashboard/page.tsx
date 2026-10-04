import { DockerDashboardContent } from '@console/console/platform/docker/DockerDashboardPage';

import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function Page() {
  return (
    <>
      <PageHeader title="Dashboard" breadcrumbs="Environment summary" reload />
      <DockerDashboardContent />
    </>
  );
}
