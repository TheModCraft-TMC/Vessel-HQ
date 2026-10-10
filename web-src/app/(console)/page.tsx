import type { Metadata } from 'next';

import { EnvironmentsContent } from '@app/_components/pages/EnvironmentsPage';
import { PageHeader } from '@/ui/layouts/view-layout/page-header';

export const metadata: Metadata = {
  title: 'Environments',
};

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Environments"
        breadcrumbs="Environment management"
        reload
      />
      <EnvironmentsContent />
    </>
  );
}
