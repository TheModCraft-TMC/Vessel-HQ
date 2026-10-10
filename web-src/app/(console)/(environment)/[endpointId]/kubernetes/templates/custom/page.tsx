import { CustomTemplatesContent } from '@app/_components/platform/TemplatePages';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Custom Templates" breadcrumbs="Custom Templates" />
      <CustomTemplatesContent />
    </>
  );
}
