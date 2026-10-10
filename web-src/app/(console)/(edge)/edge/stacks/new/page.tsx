import { EdgeStackCreateContent } from '@app/_components/pages/EdgeEntityPages';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create Edge Stack"
        breadcrumbs={[
          { label: 'Edge Stacks', link: '/edge/stacks' },
          'Create Edge Stack',
        ]}
        reload
      />
      <EdgeStackCreateContent />
    </>
  );
}
