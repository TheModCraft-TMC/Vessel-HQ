import { HelmRepositoryCreateContent } from '@app/_components/pages/HelmRepositoryCreatePage';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function NewHelmRepositoryPage() {
  return (
    <>
      <PageHeader
        title="Create Helm repository"
        breadcrumbs={[
          { label: 'My account', link: '/account' },
          { label: 'Create Helm repository' },
        ]}
        reload
      />
      <HelmRepositoryCreateContent />
    </>
  );
}
