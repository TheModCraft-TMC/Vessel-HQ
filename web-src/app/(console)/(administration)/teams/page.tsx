import { TeamsContent } from '@app/_components/pages/TeamsPage';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function TeamsPage() {
  return (
    <>
      <PageHeader
        title="Teams"
        breadcrumbs={[{ label: 'Teams management' }]}
        reload
      />
      <TeamsContent />
    </>
  );
}
