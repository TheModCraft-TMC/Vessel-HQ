import { EnvironmentGroupCreateContent } from '@app/_components/pages/EnvironmentGroupCreatePage';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function NewEnvironmentGroupPage() {
  return (
    <>
      <PageHeader
        title="Create group"
        breadcrumbs={[
          { label: 'Groups', link: '/groups' },
          { label: 'Create group' },
        ]}
      />
      <EnvironmentGroupCreateContent />
    </>
  );
}
