'use client';

import { CreateStackContent } from '@/domains/stacks/views/CreateView/CreateView';
import { PageHeader } from '@/ui/layouts/view-layout';

export default function Page() {
  return (
    <>
      <PageHeader title="Create stack" breadcrumbs="Stack creation" reload />
      <CreateStackContent />
    </>
  );
}
