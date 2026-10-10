import { CustomTemplateEditContent } from '@app/_components/platform/TemplatePages';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader
        title="Edit Custom Template"
        breadcrumbs={[
          { label: 'Custom Templates', link: '..' },
          'Edit Custom Template',
        ]}
      />
      <CustomTemplateEditContent />
    </>
  );
}
