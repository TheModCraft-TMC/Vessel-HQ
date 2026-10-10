import { EdgeWaitingRoomContent } from '@app/_components/pages/EdgeListPages';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Waiting Room"
        breadcrumbs={[{ label: 'Waiting Room' }]}
        reload
      />
      <EdgeWaitingRoomContent />
    </>
  );
}
