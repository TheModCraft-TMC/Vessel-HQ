import { EdgeGroupCreateContent } from '@app/_components/pages/EdgeEntityPages';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create edge group"
        breadcrumbs={[
          { label: 'Edge groups', link: '/edge/groups' },
          'Add edge group',
        ]}
      />
      <EdgeGroupCreateContent />
    </>
  );
}
