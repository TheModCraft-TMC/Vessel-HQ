import { notFound } from 'next/navigation';
import { CustomTemplateEditContent } from '@console/console/platform/TemplatePages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id) notFound();

  return (
    <>
      <PageHeader
        title="Edit Custom Template"
        breadcrumbs={[
          { label: 'Custom Templates', link: '..' },
          `Template ${id}`,
        ]}
      />
      <CustomTemplateEditContent />
    </>
  );
}
