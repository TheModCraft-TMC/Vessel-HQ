import { EnvironmentTagsContent } from '@app/_components/pages/EnvironmentTagsPage';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export default function TagsPage() {
  return (
    <>
      <PageHeader title="Tags" breadcrumbs="Tag management" reload />
      <EnvironmentTagsContent />
    </>
  );
}
