import { CustomTemplateCreateContent } from '@app/_components/platform/TemplatePages';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Create Custom Template"
        breadcrumbs={[
          { label: 'Custom Templates', link: '..' },
          'Create Custom Template',
        ]}
      />
      <CustomTemplateCreateContent />
    </>
  );
}
