import { AppTemplatesContent } from '@console/console/platform/TemplatePages';

import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Application templates list" breadcrumbs="Templates" />
      <AppTemplatesContent />
    </>
  );
}
